// Configuración centralizada para el backend
const config = {
  development: {
    mongodb: {
      uri: "mongodb://localhost:27017/tp6",
    },
    redis: {
      geo_url: "redis://localhost:6379",
      pop_url: "redis://localhost:6380",
    },
    port: 3001,
  },
  production: {
    mongodb: {
      uri: process.env.MONGODB_URI || "mongodb://mongodb:27017/tp6",
    },
    redis: {
      geo_url: process.env.REDIS_GEO_URL || "redis://redis-geo:6379",
      pop_url: process.env.REDIS_POP_URL || "redis://redis-pop:6379",
    },
    port: process.env.PORT || 3001,
  },
}

const env = process.env.NODE_ENV || "development"
module.exports = config[env]
