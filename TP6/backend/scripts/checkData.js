const mongoose = require("mongoose")
const redis = require("redis")
const Airport = require("../models/Airport")
const config = require("../config")

async function checkData() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(config.mongodb.uri)
    console.log("Conectado a MongoDB")

    // Conectar a Redis
    const redisClient = redis.createClient({
      url: config.redis.url,
    })
    await redisClient.connect()
    console.log("Conectado a Redis")

    // Verificar MongoDB
    const mongoCount = await Airport.countDocuments()
    console.log(`${mongoCount} aeropuertos`)

    // Verificar Redis GEO
    const redisGeoCount = await redisClient.zCard("airports_geo")
    console.log(`${redisGeoCount} ubicaciones`)

    // Verificar Redis Popularidad
    const redisPopCount = await redisClient.zCard("airport_popularity")
    console.log(`Popularidad: ${redisPopCount}`)

    // Mostrar algunos ejemplos
    const sampleAirports = await Airport.find().limit(3)
    console.log("\n Ejemplos:")
    sampleAirports.forEach((airport) => {
      console.log(
        `  - ${airport.name} (${airport.iata_code || airport.ident}) - ${airport.municipality}, ${airport.iso_country}`,
      )
    })

    // Cerrar conexiones
    await mongoose.connection.close()
    await redisClient.quit()

    console.log("\n Funciona")
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

checkData()
