const express = require("express")
const router = express.Router()
const Airport = require("../models/Airport")

// Obtener todos los aeropuertos con paginación
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Math.min(Number.parseInt(req.query.limit) || 20, 1000)
    const skip = (page - 1) * limit

    const airports = await Airport.find()
      .skip(skip)
      .limit(limit)
      .select("id ident name latitude_deg longitude_deg iso_country municipality iata_code type elevation_ft")

    const total = await Airport.countDocuments()

    res.json({
      airports,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Error obteniendo aeropuertos:", error)
    res.status(500).json({ error: error.message })
  }
})

// GET /airports/{iata_code} - SEGÚN REQUERIMIENTOS TP6
router.get("/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier
    let query

    // Si es un número, buscar por ID
    if (!isNaN(identifier)) {
      query = { id: Number.parseInt(identifier) }
    } else {
      // Si no es número, buscar por IATA code o ident
      const code = identifier.toUpperCase()
      query = {
        $or: [{ iata_code: code }, { ident: code }],
      }
    }

    const airport = await Airport.findOne(query)

    if (!airport) {
      return res.status(404).json({ error: "Aeropuerto no encontrado" })
    }

    // INCREMENTAR POPULARIDAD usando ZINCRBY como requiere el TP6
    try {
      const redisPopClient = req.app.locals.redisPopClient
      if (redisPopClient) {
        const key = airport.iata_code || airport.ident

        // ZINCRBY airport_popularity 1 {iata_code}
        await redisPopClient.sendCommand(["ZINCRBY", "airport_popularity", "1", key])

        // TTL de 1 día como requiere el TP6
        await redisPopClient.sendCommand(["EXPIRE", "airport_popularity", "86400"])

        console.log(`✅ Popularidad incrementada para ${key}`)
      }
    } catch (redisError) {
      console.log("Error incrementando popularidad:", redisError.message)
    }

    res.json(airport)
  } catch (error) {
    console.error("Error obteniendo aeropuerto:", error)
    res.status(500).json({ error: error.message })
  }
})

// GET /airports/popular - SEGÚN REQUERIMIENTOS TP6
router.get("/popular/ranking", async (req, res) => {
  try {
    const redisPopClient = req.app.locals.redisPopClient
    const limit = Number.parseInt(req.query.limit) || 10

    if (!redisPopClient) {
      return res.json([])
    }

    // USAR ZRANGE con REV WITHSCORES como requiere el TP6
    const popularCodes = await redisPopClient.sendCommand([
      "ZRANGE",
      "airport_popularity",
      "0",
      (limit - 1).toString(),
      "REV",
      "WITHSCORES",
    ])

    console.log(`✅ ZRANGE devolvió ${popularCodes.length} elementos`)

    if (popularCodes.length === 0) {
      return res.json([])
    }

    // Procesar resultados de ZRANGE WITHSCORES
    const codesWithScores = []
    for (let i = 0; i < popularCodes.length; i += 2) {
      if (i + 1 < popularCodes.length) {
        codesWithScores.push({
          code: popularCodes[i],
          score: Number.parseFloat(popularCodes[i + 1]),
        })
      }
    }

    if (codesWithScores.length === 0) {
      return res.json([])
    }

    // Obtener los datos completos de MongoDB
    const codes = codesWithScores.map((item) => item.code)
    const airports = await Airport.find({
      $or: [{ iata_code: { $in: codes } }, { ident: { $in: codes } }],
    })

    // Combinar datos con scores y ordenar
    const result = airports
      .map((airport) => {
        const key = airport.iata_code || airport.ident
        const scoreData = codesWithScores.find((item) => item.code === key)
        return {
          ...airport.toObject(),
          popularity_score: scoreData ? scoreData.score : 0,
        }
      })
      .sort((a, b) => b.popularity_score - a.popularity_score)

    console.log(`✅ Devolviendo ${result.length} aeropuertos populares`)
    res.json(result)
  } catch (error) {
    console.error("Error obteniendo aeropuertos populares:", error)
    res.status(500).json({ error: error.message })
  }
})

// POST /airports - SEGÚN REQUERIMIENTOS TP6
router.post("/", async (req, res) => {
  try {
    console.log("📝 Creando nuevo aeropuerto:", req.body)

    const {
      ident,
      name,
      latitude_deg,
      longitude_deg,
      elevation_ft,
      continent,
      iso_country,
      iso_region,
      municipality,
      iata_code,
      gps_code,
      type = "airport",
    } = req.body

    // Validaciones básicas
    if (!ident || !name || latitude_deg === undefined || longitude_deg === undefined) {
      return res.status(400).json({
        error: "Campos requeridos: ident, name, latitude_deg, longitude_deg",
      })
    }

    // Validar coordenadas
    const lat = Number.parseFloat(latitude_deg)
    const lng = Number.parseFloat(longitude_deg)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ error: "Latitud debe estar entre -90 y 90" })
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Longitud debe estar entre -180 y 180" })
    }

    // Verificar que el ident no exista
    const existingAirport = await Airport.findOne({ ident: ident.toUpperCase() })
    if (existingAirport) {
      return res.status(400).json({ error: "Ya existe un aeropuerto con ese código ICAO" })
    }

    // Verificar IATA code si se proporciona
    if (iata_code) {
      const existingIATA = await Airport.findOne({ iata_code: iata_code.toUpperCase() })
      if (existingIATA) {
        return res.status(400).json({ error: "Ya existe un aeropuerto con ese código IATA" })
      }
    }

    // Obtener el próximo ID
    const lastAirport = await Airport.findOne().sort({ id: -1 })
    const nextId = lastAirport ? lastAirport.id + 1 : 1

    const newAirport = new Airport({
      id: nextId,
      ident: ident.toUpperCase(),
      type,
      name: name.trim(),
      latitude_deg: lat,
      longitude_deg: lng,
      elevation_ft: elevation_ft ? Number.parseInt(elevation_ft) : 0,
      continent: continent || "Unknown",
      iso_country: iso_country || "Unknown",
      iso_region: iso_region || "Unknown",
      municipality: municipality || "Unknown",
      scheduled_service: "yes",
      gps_code: gps_code || null,
      iata_code: iata_code ? iata_code.toUpperCase() : null,
      keywords: name.trim(),
    })

    await newAirport.save()

    // AGREGAR A REDIS GEO usando GEOADD como requiere el TP6
    try {
      const redisGeoClient = req.app.locals.redisGeoClient
      if (redisGeoClient) {
        const key = newAirport.iata_code || newAirport.ident

        // GEOADD airports_geo lng lat IATA
        await redisGeoClient.sendCommand(["GEOADD", "airports_geo", lng.toString(), lat.toString(), key])

        console.log(`✅ Aeropuerto agregado a Redis GEO: ${key}`)
      }
    } catch (redisError) {
      console.log("Error agregando a Redis GEO:", redisError.message)
    }

    console.log("✅ Aeropuerto creado:", newAirport.name)
    res.status(201).json(newAirport)
  } catch (error) {
    console.error("❌ Error creando aeropuerto:", error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /airports/{iata_code} - SEGÚN REQUERIMIENTOS TP6
router.put("/:identifier", async (req, res) => {
  try {
    console.log("📝 Actualizando aeropuerto:", req.params.identifier, req.body)

    const identifier = req.params.identifier
    const updates = req.body
    let query

    // Si es un número, buscar por ID
    if (!isNaN(identifier)) {
      query = { id: Number.parseInt(identifier) }
    } else {
      // Si no es número, buscar por IATA code o ident
      const code = identifier.toUpperCase()
      query = {
        $or: [{ iata_code: code }, { ident: code }],
      }
    }

    // Validar coordenadas si se proporcionan
    if (updates.latitude_deg !== undefined) {
      const lat = Number.parseFloat(updates.latitude_deg)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({ error: "Latitud inválida" })
      }
      updates.latitude_deg = lat
    }

    if (updates.longitude_deg !== undefined) {
      const lng = Number.parseFloat(updates.longitude_deg)
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Longitud inválida" })
      }
      updates.longitude_deg = lng
    }

    if (updates.elevation_ft !== undefined) {
      updates.elevation_ft = Number.parseInt(updates.elevation_ft) || 0
    }

    // Normalizar códigos
    if (updates.ident) {
      updates.ident = updates.ident.toUpperCase()
    }
    if (updates.iata_code) {
      updates.iata_code = updates.iata_code.toUpperCase()
    }

    const airport = await Airport.findOneAndUpdate(query, { $set: updates }, { new: true, runValidators: true })

    if (!airport) {
      return res.status(404).json({ error: "Aeropuerto no encontrado" })
    }

    // Actualizar Redis GEO si cambiaron las coordenadas
    if (updates.latitude_deg !== undefined || updates.longitude_deg !== undefined) {
      try {
        const redisGeoClient = req.app.locals.redisGeoClient
        if (redisGeoClient) {
          const key = airport.iata_code || airport.ident

          // GEOADD airports_geo lng lat IATA (actualiza si ya existe)
          await redisGeoClient.sendCommand([
            "GEOADD",
            "airports_geo",
            airport.longitude_deg.toString(),
            airport.latitude_deg.toString(),
            key,
          ])

          console.log(`✅ Coordenadas actualizadas en Redis GEO: ${key}`)
        }
      } catch (redisError) {
        console.log("Error actualizando Redis GEO:", redisError.message)
      }
    }

    console.log("✅ Aeropuerto actualizado:", airport.name)
    res.json(airport)
  } catch (error) {
    console.error("❌ Error actualizando aeropuerto:", error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /airports/{iata_code} - SEGÚN REQUERIMIENTOS TP6
router.delete("/:identifier", async (req, res) => {
  try {
    console.log("🗑️ Eliminando aeropuerto:", req.params.identifier)

    const identifier = req.params.identifier
    let query

    // Si es un número, buscar por ID
    if (!isNaN(identifier)) {
      query = { id: Number.parseInt(identifier) }
    } else {
      // Si no es número, buscar por IATA code o ident
      const code = identifier.toUpperCase()
      query = {
        $or: [{ iata_code: code }, { ident: code }],
      }
    }

    const airport = await Airport.findOneAndDelete(query)

    if (!airport) {
      return res.status(404).json({ error: "Aeropuerto no encontrado" })
    }

    // ELIMINAR DE REDIS GEO Y POPULARIDAD como requiere el TP6
    try {
      const redisGeoClient = req.app.locals.redisGeoClient
      const redisPopClient = req.app.locals.redisPopClient
      const key = airport.iata_code || airport.ident

      if (redisGeoClient) {
        // ZREM airports_geo {iata_code}
        await redisGeoClient.sendCommand(["ZREM", "airports_geo", key])
        console.log(`✅ Eliminado de Redis GEO: ${key}`)
      }

      if (redisPopClient) {
        // ZREM airport_popularity {iata_code}
        await redisPopClient.sendCommand(["ZREM", "airport_popularity", key])
        console.log(`✅ Eliminado de Redis Popularidad: ${key}`)
      }
    } catch (redisError) {
      console.log("Error eliminando de Redis:", redisError.message)
    }

    console.log("✅ Aeropuerto eliminado:", airport.name)
    res.json({ message: "Aeropuerto eliminado exitosamente", airport })
  } catch (error) {
    console.error("❌ Error eliminando aeropuerto:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
