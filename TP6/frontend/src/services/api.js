import axios from "axios"
import config from "../config"

const API_BASE_URL = config.API_BASE_URL

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para logging de requests
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data)
    return config
  },
  (error) => {
    console.error("API Request Error:", error)
    return Promise.reject(error)
  },
)

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    return response
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message)

    // Mejorar mensajes de error
    if (error.response?.status === 404) {
      error.message = "Recurso no encontrado"
    } else if (error.response?.status === 400) {
      error.message = error.response.data?.error || "Datos inválidos"
    } else if (error.response?.status === 500) {
      error.message = "Error interno del servidor"
    } else if (error.code === "ECONNREFUSED") {
      error.message = "No se puede conectar al servidor. Verifica que esté corriendo."
    }

    throw error
  },
)

// Aeropuertos
export const getAirports = async (page = 1, limit = 20) => {
  const response = await api.get(`/airports?page=${page}&limit=${limit}`)
  return response.data
}

export const getAirportById = async (airportId) => {
  const response = await api.get(`/airports/${airportId}`)
  return response.data
}

export const getPopularAirports = async (limit = 10) => {
  const response = await api.get(`/airports/popular/ranking?limit=${limit}`)
  return response.data
}

// Búsquedas
export const searchAirportByCode = async (code) => {
  const response = await api.get(`/search/code/${code}`)
  return response.data
}

export const searchAirportByText = async (query, limit = 10) => {
  const response = await api.get(`/search/text/${encodeURIComponent(query)}?limit=${limit}`)
  return response.data
}

// Ubicación
export const getNearbyAirports = async (lat, lon, radius = 100) => {
  const response = await api.get(`/location/nearby?lat=${lat}&lon=${lon}&radius=${radius}`)
  return response.data
}

export const getDistanceBetweenAirports = async (code1, code2) => {
  const response = await api.get(`/location/distance/${code1}/${code2}`)
  return response.data
}

// CRUD Operations
export const createAirport = async (airportData) => {
  console.log("Creando aeropuerto:", airportData)
  const response = await api.post("/airports", airportData)
  return response.data
}

export const updateAirport = async (airportId, airportData) => {
  console.log("Actualizando aeropuerto:", airportId, airportData)
  const response = await api.put(`/airports/${airportId}`, airportData)
  return response.data
}

export const deleteAirport = async (airportId) => {
  console.log("Eliminando aeropuerto:", airportId)
  const response = await api.delete(`/airports/${airportId}`)
  return response.data
}

export default api
