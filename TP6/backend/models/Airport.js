const mongoose = require("mongoose")

const airportSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    ident: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    latitude_deg: {
      type: Number,
      required: true,
    },
    longitude_deg: {
      type: Number,
      required: true,
    },
    elevation_ft: Number,
    continent: String,
    iso_country: {
      type: String,
      index: true,
    },
    iso_region: String,
    municipality: {
      type: String,
      index: true,
    },
    scheduled_service: String,
    gps_code: {
      type: String,
      index: true,
    },
    iata_code: {
      type: String,
      index: true,
      sparse: true,
    },
    local_code: String,
    home_link: String,
    wikipedia_link: String,
    keywords: String,
  },
  {
    timestamps: true,
  },
)

// Índices compuestos para búsquedas geoespaciales
airportSchema.index({ latitude_deg: 1, longitude_deg: 1 })
airportSchema.index({ name: "text", municipality: "text", keywords: "text" })

// Evitar crear índices duplicados
airportSchema.set("autoIndex", false)

module.exports = mongoose.model("Airport", airportSchema)
