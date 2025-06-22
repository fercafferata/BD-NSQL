const express = require("express")
const router = express.Router()
const Airport = require("../models/Airport")

// Encontrar aeropuertos cercanos usando GEORADIUS - CORREGIDO PARA ARGENTINA
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lon, radius = 1000 } = req.query // Radio por defecto 1000km para Argentina

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitud y longitud son requeridas" })
    }

    const latitude = Number.parseFloat(lat)
    const longitude = Number.parseFloat(lon)
    const searchRadius = Number.parseFloat(radius)

    console.log(`GEORADIUS: Buscando cerca de ${latitude}, ${longitude} en radio de ${searchRadius}km`)

    const redisGeoClient = req.app.locals.redisGeoClient

    if (!redisGeoClient) {
      console.log("Redis GEO no disponible, usando fallback MongoDB")
      return await fallbackNearbySearch(latitude, longitude, searchRadius, res)
    }

    try {
      // GEORADIUS con parámetros correctos
      const georadiusResult = await redisGeoClient.sendCommand([
        "GEORADIUS",
        "airports_geo",
        longitude.toString(),
        latitude.toString(),
        searchRadius.toString(),
        "km",
        "WITHCOORD",
        "WITHDIST",
        "COUNT",
        "100", // Aumentar límite
        "ASC",
      ])

      console.log(`GEORADIUS devolvió ${georadiusResult.length} resultados`)

      if (georadiusResult.length === 0) {
        console.log("GEORADIUS no encontró aeropuertos, usando fallback")
        return await fallbackNearbySearch(latitude, longitude, searchRadius, res)
      }

      // Procesar resultados de GEORADIUS
      const airportCodes = []
      const distanceMap = new Map()

      georadiusResult.forEach((result) => {
        if (Array.isArray(result) && result.length >= 3) {
          const code = result[0] // IATA/ICAO code
          const distance = Number.parseFloat(result[1]) // Distancia en km
          const coordinates = result[2] // [lng, lat]

          airportCodes.push(code)
          distanceMap.set(code, {
            distance_km: Math.round(distance * 100) / 100,
            coordinates: coordinates,
          })

          console.log(`Encontrado: ${code} a ${distance}km`)
        }
      })

      if (airportCodes.length === 0) {
        console.log("No se pudieron procesar resultados de GEORADIUS")
        return await fallbackNearbySearch(latitude, longitude, searchRadius, res)
      }

      // Obtener datos completos de MongoDB
      const airports = await Airport.find({
        $or: [{ iata_code: { $in: airportCodes } }, { ident: { $in: airportCodes } }],
      })

      console.log(`MongoDB encontró ${airports.length} aeropuertos de ${airportCodes.length} códigos`)

      // Combinar datos con distancias
      const result = airports
        .map((airport) => {
          const key = airport.iata_code || airport.ident
          const geoData = distanceMap.get(key)

          return {
            ...airport.toObject(),
            distance_km: geoData ? geoData.distance_km : null,
          }
        })
        .filter((airport) => airport.distance_km !== null)

      // Ordenar por distancia
      result.sort((a, b) => a.distance_km - b.distance_km)

      console.log(`Devolviendo ${result.length} aeropuertos cercanos`)
      res.json(result)
    } catch (redisError) {
      console.error("Error ejecutando GEORADIUS:", redisError)
      return await fallbackNearbySearch(latitude, longitude, searchRadius, res)
    }
  } catch (error) {
    console.error("Error en endpoint nearby:", error)
    res.status(500).json({ error: error.message })
  }
})

// Función fallback para buscar aeropuertos cercanos usando MongoDB
async function fallbackNearbySearch(latitude, longitude, searchRadius, res) {
  try {
    console.log(`Fallback: Buscando aeropuertos cerca de ${latitude}, ${longitude}`)

    // Cambiar el radio de búsqueda para Argentina - coordenadas más precisas
    const latDelta = searchRadius / 111 // 111 km por grado de latitud
    const lngDelta = searchRadius / (111 * Math.cos((Math.abs(latitude) * Math.PI) / 180)) // Usar valor absoluto

    console.log(
      `Buscando en área: lat ${latitude - latDelta} a ${latitude + latDelta}, lng ${longitude - lngDelta} a ${longitude + lngDelta}`,
    )

    const airports = await Airport.find({
      latitude_deg: {
        $gte: latitude - latDelta,
        $lte: latitude + latDelta,
      },
      longitude_deg: {
        $gte: longitude - lngDelta,
        $lte: longitude + lngDelta,
      },
    }).limit(200) // Aumentar límite

    console.log(`Fallback encontró ${airports.length} aeropuertos en área ampliada`)

    // Calcular distancias reales
    const result = airports
      .map((airport) => {
        const distance = calculateDistance(latitude, longitude, airport.latitude_deg, airport.longitude_deg)
        return {
          ...airport.toObject(),
          distance_km: Math.round(distance * 100) / 100,
        }
      })
      .filter((airport) => airport.distance_km <= searchRadius)

    // Ordenar por distancia
    result.sort((a, b) => a.distance_km - b.distance_km)

    console.log(`Fallback devuelve ${result.length} aeropuertos dentro del radio`)
    res.json(result)
  } catch (fallbackError) {
    console.error("Error en fallback:", fallbackError)
    res.status(500).json({ error: "Error en búsqueda de aeropuertos cercanos" })
  }
}

// Calcular distancia entre dos aeropuertos
router.get("/distance/:code1/:code2", async (req, res) => {
  try {
    const code1 = req.params.code1.toUpperCase()
    const code2 = req.params.code2.toUpperCase()

    const airports = await Airport.find({
      $or: [{ iata_code: { $in: [code1, code2] } }, { ident: { $in: [code1, code2] } }],
    })

    if (airports.length !== 2) {
      return res.status(404).json({ error: "Uno o ambos aeropuertos no encontrados" })
    }

    const [airport1, airport2] = airports

    const distance = calculateDistance(
      airport1.latitude_deg,
      airport1.longitude_deg,
      airport2.latitude_deg,
      airport2.longitude_deg,
    )

    res.json({
      airport1: {
        code: airport1.iata_code || airport1.ident,
        name: airport1.name,
        coordinates: [airport1.latitude_deg, airport1.longitude_deg],
      },
      airport2: {
        code: airport2.iata_code || airport2.ident,
        name: airport2.name,
        coordinates: [airport2.latitude_deg, airport2.longitude_deg],
      },
      distance_km: Math.round(distance * 100) / 100,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Función para calcular distancia usando Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

module.exports = router
