const mongoose = require("mongoose")
const redis = require("redis")
const fs = require("fs")
const path = require("path")
const Airport = require("../models/Airport")
const config = require("../config")

// Función para procesar el archivo JSON con mejor manejo de errores
function processDataFile(filePath) {
  try {
    console.log("📖 Leyendo archivo de datos...")

    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`)
    }

    let rawData = fs.readFileSync(filePath, "utf8")
    console.log(`📊 Archivo leído: ${(rawData.length / 1024 / 1024).toFixed(2)} MB`)

    // Limpiar datos
    rawData = rawData.trim().replace(/^\uFEFF/, "")

    let jsonData
    try {
      jsonData = JSON.parse(rawData)
    } catch (parseError) {
      console.log("🔧 Intentando reparar JSON malformado...")

      // Intentar dividir por líneas y parsear cada objeto
      const lines = rawData.split("\n").filter((line) => line.trim())
      jsonData = []

      for (const line of lines) {
        try {
          const obj = JSON.parse(line.trim())
          jsonData.push(obj)
        } catch (lineError) {
          // Ignorar líneas que no se pueden parsear
          continue
        }
      }

      if (jsonData.length === 0) {
        throw new Error("No se pudieron extraer datos válidos del archivo")
      }
    }

    console.log(`✅ Datos procesados: ${jsonData.length} elementos`)
    return jsonData
  } catch (error) {
    console.error("❌ Error procesando archivo:", error.message)
    throw error
  }
}

// Función para convertir datos al formato esperado
function convertToAirportFormat(rawData) {
  console.log("🔄 Convirtiendo al formato de aeropuerto...")

  const airports = []
  let processed = 0
  let valid = 0

  rawData.forEach((item, index) => {
    processed++

    try {
      if (!item || typeof item !== "object") return

      // Extraer coordenadas
      const lat = Number.parseFloat(item.lat || item.latitude || item.latitude_deg || 0)
      const lng = Number.parseFloat(item.lng || item.lon || item.longitude || item.longitude_deg || 0)

      // Validar coordenadas
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return

      // Extraer nombre
      const name = item.name || item.airport_name || item.facility_name || `Airport ${index + 1}`
      if (!name || name.trim().length === 0) return

      // Crear objeto aeropuerto
      const airport = {
        id: index + 1,
        ident: item.icao || item.ident || item.iata_faa || `UNKN${String(index + 1).padStart(4, "0")}`,
        type: item.type || "airport",
        name: name.trim(),
        latitude_deg: lat,
        longitude_deg: lng,
        elevation_ft: Number.parseInt(item.alt || item.elevation || item.elevation_ft || 0) || 0,
        continent: item.continent || "Unknown",
        iso_country: item.country || item.iso_country || "Unknown",
        iso_region: item.region || item.iso_region || "Unknown",
        municipality: item.city || item.municipality || "Unknown",
        scheduled_service: "yes",
        gps_code: item.icao || item.gps_code || null,
        iata_code:
          (item.iata_faa || item.iata) && (item.iata_faa || item.iata).length === 3 ? item.iata_faa || item.iata : null,
        local_code: item.local_code || null,
        home_link: item.home_link || null,
        wikipedia_link: item.wikipedia_link || null,
        keywords: name.trim(),
      }

      airports.push(airport)
      valid++
    } catch (error) {
      console.log(`⚠️ Error procesando elemento ${index}:`, error.message)
    }
  })

  console.log(`✅ Conversión completada: ${valid}/${processed} elementos válidos`)
  return airports
}

async function importData() {
  let mongoConnection = null
  let redisGeoClient = null
  let redisPopClient = null

  try {
    console.log("🚀 Iniciando importación de datos...")

    // Conectar a MongoDB
    console.log("📡 Conectando a MongoDB...")
    mongoConnection = await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ MongoDB conectado")

    // Conectar a Redis GEO
    console.log("📡 Conectando a Redis GEO...")
    redisGeoClient = redis.createClient({ url: config.redis.geo_url })
    await redisGeoClient.connect()
    console.log("✅ Redis GEO conectado")

    // Conectar a Redis Popularidad
    console.log("📡 Conectando a Redis Popularidad...")
    redisPopClient = redis.createClient({ url: config.redis.pop_url })
    await redisPopClient.connect()
    console.log("✅ Redis Popularidad conectado")

    // Buscar archivo de datos
    const possiblePaths = [
      path.join(__dirname, "../../data_trasport-y5BJ8URQizYcNY6LbZ0sFVgpWThJf1.json"),
      path.join(__dirname, "../data_trasport-y5BJ8URQizYcNY6LbZ0sFVgpWThJf1.json"),
      "./data_trasport-y5BJ8URQizYcNY6LbZ0sFVgpWThJf1.json",
    ]

    let dataPath = null
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        dataPath = testPath
        break
      }
    }

    if (!dataPath) {
      throw new Error("Archivo de datos no encontrado en ninguna ubicación")
    }

    console.log(`📁 Usando archivo: ${dataPath}`)

    // Procesar datos
    const rawData = processDataFile(dataPath)
    const airportData = convertToAirportFormat(rawData)

    if (airportData.length === 0) {
      throw new Error("No se generaron datos válidos para importar")
    }

    console.log(`📊 Preparando importación de ${airportData.length} aeropuertos...`)

    // Limpiar datos existentes
    console.log("🧹 Limpiando datos existentes...")

    // Eliminar índices existentes para evitar conflictos
    try {
      await Airport.collection.dropIndexes()
      console.log("🗑️ Índices eliminados")
    } catch (indexError) {
      console.log("⚠️ No se pudieron eliminar índices (puede ser normal):", indexError.message)
    }

    await Airport.deleteMany({})
    await redisGeoClient.del("airports_geo")
    await redisPopClient.del("airport_popularity")

    // Configurar TTL para popularidad
    await redisPopClient.expire("airport_popularity", 86400)

    // Importar en lotes
    const batchSize = 100
    let imported = 0

    for (let i = 0; i < airportData.length; i += batchSize) {
      const batch = airportData.slice(i, i + batchSize)

      try {
        // Insertar en MongoDB
        await Airport.insertMany(batch, { ordered: false })

        // Agregar coordenadas a Redis GEO usando IATA code como key
        const geoData = []
        batch.forEach((airport) => {
          const key = airport.iata_code || airport.ident
          geoData.push(airport.longitude_deg, airport.latitude_deg, key)
        })

        if (geoData.length > 0) {
          await redisGeoClient.geoAdd("airports_geo", geoData)
        }

        imported += batch.length
        const progress = Math.round((imported / airportData.length) * 100)
        console.log(`📈 Progreso: ${imported}/${airportData.length} (${progress}%)`)
      } catch (batchError) {
        console.log(`⚠️ Error en lote ${i}-${i + batchSize}:`, batchError.message)
      }
    }

    // Crear índices necesarios después de la importación
    console.log("🔧 Creando índices optimizados...")
    try {
      // Crear índices uno por uno para evitar conflictos
      await Airport.collection.createIndex({ iata_code: 1 }, { sparse: true })
      await Airport.collection.createIndex({ ident: 1 })
      await Airport.collection.createIndex({ name: "text", municipality: "text", keywords: "text" })
      await Airport.collection.createIndex({ latitude_deg: 1, longitude_deg: 1 })
      await Airport.collection.createIndex({ iso_country: 1 })
      console.log("✅ Índices creados correctamente")
    } catch (indexError) {
      console.log("⚠️ Error creando algunos índices:", indexError.message)
    }

    // Verificar importación
    const finalCount = await Airport.countDocuments()
    const geoCount = await redisGeoClient.zCard("airports_geo")

    console.log(`✅ Importación completada:`)
    console.log(`   - MongoDB: ${finalCount} aeropuertos`)
    console.log(`   - Redis GEO: ${geoCount} ubicaciones`)

    if (finalCount === 0) {
      throw new Error("No se importaron aeropuertos. Revisa el formato de datos.")
    }
  } catch (error) {
    console.error("❌ Error durante la importación:", error.message)
    throw error
  } finally {
    // Cerrar conexiones
    if (redisGeoClient) {
      try {
        await redisGeoClient.quit()
        console.log("🔌 Redis GEO desconectado")
      } catch (e) {
        console.log("⚠️ Error cerrando Redis GEO:", e.message)
      }
    }

    if (redisPopClient) {
      try {
        await redisPopClient.quit()
        console.log("🔌 Redis Popularidad desconectado")
      } catch (e) {
        console.log("⚠️ Error cerrando Redis Popularidad:", e.message)
      }
    }

    if (mongoConnection) {
      try {
        await mongoose.connection.close()
        console.log("🔌 MongoDB desconectado")
      } catch (e) {
        console.log("⚠️ Error cerrando MongoDB:", e.message)
      }
    }
  }
}

// Ejecutar importación
if (require.main === module) {
  importData()
    .then(() => {
      console.log("🎉 Importación exitosa")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Importación falló:", error.message)
      process.exit(1)
    })
}

module.exports = { importData }
