const express = require("express")
const mongoose = require("mongoose")
const redis = require("redis")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const fs = require("fs")
const path = require("path")
const config = require("./config")
const Airport = require("./models/Airport")

const app = express()
const PORT = config.port

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})
app.use(limiter)

// Variables globales para Redis
let redisGeoClient
let redisPopClient

// Función para esperar a que un servicio esté disponible
async function waitForService(serviceName, checkFunction, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await checkFunction()
      console.log(`✅ ${serviceName} está disponible`)
      return true
    } catch (error) {
      console.log(`⏳ Esperando ${serviceName}... (intento ${i + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
  throw new Error(`❌ ${serviceName} no está disponible después de ${maxRetries} intentos`)
}

// Función mejorada para procesar el archivo JSON
function processTransportData(filePath) {
  try {
    console.log("📖 Procesando archivo de datos de transporte...")

    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`)
    }

    let rawData = fs.readFileSync(filePath, "utf8")
    console.log(`📊 Tamaño del archivo: ${(rawData.length / 1024 / 1024).toFixed(2)} MB`)

    // Limpiar el archivo
    rawData = rawData
      .replace(/^\uFEFF/, "") // Eliminar BOM
      .replace(/\r\n/g, "\n") // Normalizar saltos de línea
      .replace(/\r/g, "\n")
      .trim()

    let jsonData

    try {
      // Intentar parsear como JSON normal primero
      jsonData = JSON.parse(rawData)
      console.log(`✅ JSON parseado correctamente: ${jsonData.length} elementos`)
    } catch (parseError) {
      console.log("🔧 JSON malformado, intentando reparar...")

      // Si falla, intentar reparar línea por línea
      const lines = rawData.split("\n").filter((line) => line.trim())
      const objects = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          // Intentar parsear cada línea como objeto JSON
          const obj = JSON.parse(line)
          objects.push(obj)
        } catch (lineError) {
          // Si la línea no es JSON válido, intentar concatenar con la siguiente
          let multiLineJson = line
          let j = i + 1
          let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length

          while (j < lines.length && braceCount > 0) {
            multiLineJson += "\n" + lines[j].trim()
            braceCount += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length
            j++
          }

          try {
            const obj = JSON.parse(multiLineJson)
            objects.push(obj)
            i = j - 1 // Saltar las líneas procesadas
          } catch (multiLineError) {
            console.log(`⚠️ No se pudo parsear línea ${i + 1}: ${line.substring(0, 50)}...`)
          }
        }
      }

      jsonData = objects
      console.log(`🔧 Reparación completada: ${jsonData.length} objetos extraídos`)
    }

    if (!Array.isArray(jsonData)) {
      throw new Error("Los datos no son un array válido")
    }

    return jsonData
  } catch (error) {
    console.error("❌ Error procesando archivo de datos:", error.message)
    throw error
  }
}

// Función mejorada para convertir datos al formato de aeropuerto
function convertToAirportFormat(rawData) {
  console.log("🔄 Convirtiendo datos al formato de aeropuerto...")

  const airports = []
  let validCount = 0
  let invalidCount = 0

  rawData.forEach((item, index) => {
    try {
      if (!item || typeof item !== "object") {
        invalidCount++
        return
      }

      // Extraer coordenadas con múltiples formatos posibles
      let latitude = null
      let longitude = null

      // Intentar diferentes campos para latitud
      const latFields = ["lat", "latitude", "latitude_deg", "coord_lat", "y"]
      const lngFields = ["lng", "lon", "longitude", "longitude_deg", "coord_lng", "coord_lon", "x"]

      for (const field of latFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== "") {
          const val = Number.parseFloat(item[field])
          if (!isNaN(val) && val >= -90 && val <= 90) {
            latitude = val
            break
          }
        }
      }

      for (const field of lngFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== "") {
          const val = Number.parseFloat(item[field])
          if (!isNaN(val) && val >= -180 && val <= 180) {
            longitude = val
            break
          }
        }
      }

      // Si no hay coordenadas válidas, saltar
      if (latitude === null || longitude === null) {
        invalidCount++
        return
      }

      // Extraer nombre con múltiples formatos posibles
      const nameFields = ["name", "airport_name", "facility_name", "site_name"]
      let name = "Unknown Airport"

      for (const field of nameFields) {
        if (item[field] && typeof item[field] === "string" && item[field].trim()) {
          name = item[field].trim()
          break
        }
      }

      // Extraer códigos
      const iataCode = item.iata_faa || item.iata || item.iata_code || null
      const icaoCode = item.icao || item.ident || item.icao_code || null
      const ident = icaoCode || iataCode || `UNKN${String(index + 1).padStart(4, "0")}`

      // Extraer ubicación
      const municipality = item.city || item.municipality || item.location || "Unknown"
      const country = item.country || item.iso_country || "Unknown"

      // Extraer elevación
      let elevation = 0
      const elevationFields = ["alt", "altitude", "elevation", "elevation_ft"]
      for (const field of elevationFields) {
        if (item[field] !== undefined && item[field] !== null) {
          const val = Number.parseInt(item[field])
          if (!isNaN(val)) {
            elevation = val
            break
          }
        }
      }

      const airport = {
        id: index + 1,
        ident: ident,
        type: item.type || "airport",
        name: name,
        latitude_deg: latitude,
        longitude_deg: longitude,
        elevation_ft: elevation,
        continent: item.continent || "Unknown",
        iso_country: country,
        iso_region: item.region || item.iso_region || "Unknown",
        municipality: municipality,
        scheduled_service: "yes",
        gps_code: icaoCode,
        iata_code: iataCode && iataCode.length === 3 ? iataCode : null,
        local_code: item.local_code || null,
        home_link: item.home_link || null,
        wikipedia_link: item.wikipedia_link || null,
        keywords: name,
      }

      airports.push(airport)
      validCount++
    } catch (error) {
      console.log(`⚠️ Error procesando elemento ${index}:`, error.message)
      invalidCount++
    }
  })

  console.log(`✅ Conversión completada: ${validCount} válidos, ${invalidCount} inválidos`)
  return airports
}

// Función de importación automática mejorada - USANDO GEOADD COMO REQUIERE TP6
async function autoImportData() {
  try {
    const count = await Airport.countDocuments()
    if (count > 0) {
      console.log(`✅ Base de datos ya tiene ${count} aeropuertos`)
      return
    }

    console.log("📥 Iniciando importación automática de datos...")

    // Buscar el archivo de datos en diferentes ubicaciones
    const possiblePaths = [
      "/app/data_trasport-y5BJ8URQizYcNY6LbZ0sFVgpWThJf1.json",
      "./data_trasport-y5BJ8URQizYcNY6LbZ0sFVgpWThJf1.json",
      "../data_trasport-y5BJ8URQizYcNY6LbZ0sFVgpWThJf1.json",
    ]

    let jsonPath = null
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        jsonPath = path
        break
      }
    }

    if (!jsonPath) {
      console.error("❌ Archivo de datos no encontrado en ninguna ubicación")
      console.log("📂 Ubicaciones buscadas:", possiblePaths)
      return
    }

    console.log(`📁 Usando archivo: ${jsonPath}`)

    // Procesar datos
    const rawData = processTransportData(jsonPath)
    const airportData = convertToAirportFormat(rawData)

    if (airportData.length === 0) {
      console.error("❌ No se pudieron procesar datos válidos")
      return
    }

    console.log(`📊 Preparando importación de ${airportData.length} aeropuertos...`)

    // Limpiar Redis
    try {
      await redisGeoClient.sendCommand(["DEL", "airports_geo"])
      await redisPopClient.sendCommand(["DEL", "airport_popularity"])

      // Configurar TTL de 1 día para popularidad como requiere TP6
      await redisPopClient.sendCommand(["EXPIRE", "airport_popularity", "86400"])
      console.log("🧹 Redis limpiado y TTL configurado")
    } catch (redisError) {
      console.log("⚠️ Error limpiando Redis:", redisError.message)
    }

    // Importar en lotes
    const batchSize = 50
    let imported = 0
    let errors = 0

    for (let i = 0; i < airportData.length; i += batchSize) {
      const batch = airportData.slice(i, i + batchSize)

      try {
        // Insertar en MongoDB
        await Airport.insertMany(batch, { ordered: false })

        // AGREGAR A REDIS GEO usando GEOADD como requiere el TP6
        const geoCommands = []
        batch.forEach((airport) => {
          if (airport.longitude_deg && airport.latitude_deg) {
            const key = airport.iata_code || airport.ident
            // GEOADD airports_geo lng lat IATA
            geoCommands.push(airport.longitude_deg, airport.latitude_deg, key)
          }
        })

        if (geoCommands.length > 0) {
          try {
            await redisGeoClient.sendCommand(["GEOADD", "airports_geo", ...geoCommands])

            // Log específico para aeropuertos argentinos/sudamericanos
            batch.forEach((airport) => {
              if (airport.latitude_deg < -20 && airport.longitude_deg < -40) {
                // Sudamérica aproximadamente
                console.log(
                  `🇦🇷 Aeropuerto sudamericano agregado a Redis: ${airport.name} (${airport.iata_code || airport.ident}) - ${airport.latitude_deg}, ${airport.longitude_deg}`,
                )
              }
            })
          } catch (geoError) {
            console.log(`⚠️ Error Redis GEO lote ${i}:`, geoError.message)
          }
        }

        imported += batch.length
        console.log(
          `📈 Progreso: ${imported}/${airportData.length} (${Math.round((imported / airportData.length) * 100)}%)`,
        )
      } catch (error) {
        console.log(`⚠️ Error en lote ${i}-${i + batchSize}:`, error.message)
        errors += batch.length
      }
    }

    console.log(`✅ Importación completada: ${imported} aeropuertos importados, ${errors} errores`)

    // Verificar importación
    const finalCount = await Airport.countDocuments()
    console.log(`🎯 Verificación final: ${finalCount} aeropuertos en la base de datos`)
  } catch (error) {
    console.error("❌ Error durante la importación:", error.message)
    console.error("Stack:", error.stack)
  }
}

// Función principal de inicialización
async function initializeApp() {
  try {
    console.log("🚀 Iniciando aplicación...")

    // Esperar a MongoDB
    await waitForService("MongoDB", async () => {
      await mongoose.connect(config.mongodb.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      })
    })

    // Esperar a Redis GEO
    await waitForService("Redis GEO", async () => {
      redisGeoClient = redis.createClient({ url: config.redis.geo_url })
      await redisGeoClient.connect()
      await redisGeoClient.ping()
    })

    // Esperar a Redis Popularidad
    await waitForService("Redis Popularidad", async () => {
      redisPopClient = redis.createClient({ url: config.redis.pop_url })
      await redisPopClient.connect()
      await redisPopClient.ping()
    })

    console.log("✅ Todas las conexiones establecidas")

    // Hacer disponible Redis para las rutas
    app.locals.redisGeoClient = redisGeoClient
    app.locals.redisPopClient = redisPopClient

    // Importar datos automáticamente
    await autoImportData()

    // Cargar rutas
    const airportRoutes = require("./routes/airports")
    const searchRoutes = require("./routes/search")
    const locationRoutes = require("./routes/location")

    app.use("/api/airports", airportRoutes)
    app.use("/api/search", searchRoutes)
    app.use("/api/location", locationRoutes)

    // Ruta de salud mejorada
    app.get("/health", async (req, res) => {
      try {
        const airportsCount = await Airport.countDocuments()

        // Verificar Redis GEO
        const redisGeoCount = await redisGeoClient.sendCommand(["ZCARD", "airports_geo"])

        // Verificar Redis Popularidad
        const redisPopCount = await redisPopClient.sendCommand(["ZCARD", "airport_popularity"])

        res.json({
          status: "OK",
          timestamp: new Date().toISOString(),
          airports_count: airportsCount,
          redis_geo_count: redisGeoCount,
          redis_pop_count: redisPopCount,
          services: {
            mongodb: "connected",
            redis_geo: "connected",
            redis_pop: "connected",
          },
        })
      } catch (error) {
        res.status(500).json({
          status: "ERROR",
          timestamp: new Date().toISOString(),
          error: error.message,
        })
      }
    })

    // Ruta de prueba para verificar datos
    app.get("/api/test", async (req, res) => {
      try {
        const sampleAirports = await Airport.find().limit(5)
        res.json({
          message: "API funcionando correctamente",
          sample_airports: sampleAirports,
          total_count: await Airport.countDocuments(),
        })
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    // Middleware de errores
    app.use((err, req, res, next) => {
      console.error(err.stack)
      res.status(500).json({ error: "Error interno del servidor" })
    })

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🎉 Servidor corriendo en puerto ${PORT}`)
      console.log(`🌐 API disponible en http://localhost:${PORT}`)
      console.log(`🏥 Health check: http://localhost:${PORT}/health`)
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`)
    })
  } catch (error) {
    console.error("💥 Error fatal:", error)
    process.exit(1)
  }
}

// Manejar señales de cierre
process.on("SIGTERM", async () => {
  console.log("🛑 Cerrando aplicación...")
  if (redisGeoClient) await redisGeoClient.quit()
  if (redisPopClient) await redisPopClient.quit()
  if (mongoose.connection) await mongoose.connection.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("🛑 Cerrando aplicación...")
  if (redisGeoClient) await redisGeoClient.quit()
  if (redisPopClient) await redisPopClient.quit()
  if (mongoose.connection) await mongoose.connection.close()
  process.exit(0)
})

// Inicializar
initializeApp()
