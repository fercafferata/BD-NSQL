const express = require("express")
const router = express.Router()
const Airport = require("../models/Airport")

// Búsqueda por código IATA o ICAO
router.get("/code/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase()

    // Buscar por IATA o ICAO (ident o gps_code)
    const airport = await Airport.findOne({
      $or: [{ iata_code: code }, { ident: code }, { gps_code: code }],
    })

    if (!airport) {
      return res.status(404).json({ error: "Aeropuerto no encontrado con ese código" })
    }

    // Incrementar popularidad
    const redisClient = req.app.locals.redisClient
    await redisClient.zIncrBy("airport_popularity", 1, airport.id.toString())

    res.json(airport)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Búsqueda por texto (nombre, ciudad, etc.)
router.get("/text/:query", async (req, res) => {
  try {
    const query = req.params.query
    const limit = Number.parseInt(req.query.limit) || 10

    const airports = await Airport.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { municipality: { $regex: query, $options: "i" } },
        { iso_country: { $regex: query, $options: "i" } },
        { keywords: { $regex: query, $options: "i" } },
      ],
    })
      .limit(limit)
      .select("id ident name latitude_deg longitude_deg iso_country municipality iata_code")

    res.json(airports)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
