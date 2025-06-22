"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import styled from "styled-components"
import L from "leaflet"
import SearchBox from "../components/SearchBox"
import { getAirports, getNearbyAirports, getAirportById } from "../services/api"
import "leaflet/dist/leaflet.css"

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
})

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 80px);
  padding: 2rem;
`

const TopSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
`

const Title = styled.h1`
  color: white;
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;
`

const MapPageContainer = styled.div`
  height: calc(100vh - 200px);
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const MapControls = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`

const ControlButton = styled.button`
  display: block;
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
  
  &:hover {
    background: #5a67d8;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const StyledMapContainer = styled(MapContainer)`
  height: 100%;
  width: 100%;
`

const MapInfo = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
`

const SuccessMessage = styled.div`
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  color: #51cf66;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
`

// Componente para manejar la ubicación del usuario
function LocationMarker({ onLocationFound }) {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map
      .locate({
        setView: false,
        maxZoom: 16,
        timeout: 10000,
        enableHighAccuracy: true,
      })
      .on("locationfound", (e) => {
        console.log("✅ Ubicación encontrada:", e.latlng)
        setPosition(e.latlng)
        onLocationFound(e.latlng)
      })
      .on("locationerror", (e) => {
        console.log("❌ Error de ubicación:", e.message)
      })
  }, [map, onLocationFound])

  return (
    <>
      {position && (
        <Marker position={position}>
          <Popup>
            <div>
              <h4>📍 Tu ubicación actual</h4>
              <p>Lat: {position.lat.toFixed(4)}</p>
              <p>Lng: {position.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  )
}

function Home() {
  const navigate = useNavigate()
  const [airports, setAirports] = useState([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [showNearby, setShowNearby] = useState(false)
  const [visitedAirports, setVisitedAirports] = useState(0)
  const [errorMsg, setErrorMsg] = useState(null)
  const [success, setSuccess] = useState(null)
  const [mapCenter, setMapCenter] = useState([20, 0])
  const [mapZoom, setMapZoom] = useState(2)

  const loadAllAirports = async () => {
    setLoading(true)
    setErrorMsg(null)
    setSuccess(null)

    try {
      console.log("🔄 Cargando todos los aeropuertos...")
      const data = await getAirports(1, 500)

      if (data && data.airports && Array.isArray(data.airports)) {
        console.log(`✅ ${data.airports.length} aeropuertos cargados`)
        setAirports(data.airports)
        setShowNearby(false)
        setMapCenter([20, 0]) // Vista mundial
        setMapZoom(2)
        setSuccess(`✅ ${data.airports.length} aeropuertos cargados correctamente`)
      } else {
        throw new Error("No se recibieron datos válidos del servidor")
      }
    } catch (error) {
      console.error("❌ Error cargando aeropuertos:", error)
      setErrorMsg(`Error cargando aeropuertos: ${error.message}`)
      setAirports([])
    } finally {
      setLoading(false)
    }
  }

  const loadNearbyAirports = async () => {
    if (!userLocation) {
      setErrorMsg("❌ Primero necesitas permitir acceso a tu ubicación")
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccess(null)

    try {
      console.log(`🔄 Buscando aeropuertos cerca de ${userLocation.lat}, ${userLocation.lng}`)

      // RADIO MÁS GRANDE para Argentina
      const nearbyAirports = await getNearbyAirports(userLocation.lat, userLocation.lng, 1500)

      console.log("📊 Respuesta de aeropuertos cercanos:", nearbyAirports)

      if (Array.isArray(nearbyAirports) && nearbyAirports.length > 0) {
        console.log(`✅ ${nearbyAirports.length} aeropuertos cercanos encontrados`)
        setAirports(nearbyAirports)
        setShowNearby(true)

        // CENTRAR EL MAPA EN LA UBICACIÓN DEL USUARIO
        setMapCenter([userLocation.lat, userLocation.lng])
        setMapZoom(7) // Zoom para ver Argentina

        setSuccess(`✅ ${nearbyAirports.length} aeropuertos encontrados en radio de 1500km`)
      } else {
        console.log("⚠️ No se encontraron aeropuertos cercanos")
        setErrorMsg("No se encontraron aeropuertos cercanos. Verifica que los datos estén cargados correctamente.")
      }
    } catch (error) {
      console.error("❌ Error cargando aeropuertos cercanos:", error)
      setErrorMsg(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationFound = (latlng) => {
    console.log("📍 Ubicación del usuario:", latlng)
    setUserLocation(latlng)
    setSuccess(`📍 Ubicación encontrada: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`)
  }

  const handleAirportClick = useCallback(async (airport) => {
    try {
      const code = airport.iata_code || airport.ident
      await getAirportById(code)
      setVisitedAirports((prev) => prev + 1)
      console.log(`✅ Aeropuerto visitado: ${airport.name}`)
    } catch (error) {
      console.error("Error registrando visita:", error)
    }
  }, [])

  const handleSearch = (results) => {
    navigate("/search", { state: { results } })
  }

  // Cargar aeropuertos al inicio
  useEffect(() => {
    loadAllAirports()
  }, [])

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (errorMsg || success) {
      const timer = setTimeout(() => {
        setErrorMsg(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMsg, success])

  return (
    <HomeContainer>
      <TopSection>
        <Title>✈️ Aeropuertos del Mundo ✈️</Title>
        <Subtitle>
          Explora aeropuertos en el mapa. Permití acceder a tu ubicación para ver aeropuertos cercanos.
        </Subtitle>
        <SearchBox onResults={handleSearch} />
      </TopSection>

      {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <MapPageContainer>
        <MapControls>
          <h3 style={{ margin: "0 0 1rem 0", color: "#333" }}>Controles del Mapa</h3>
          <ControlButton onClick={loadAllAirports} disabled={loading}>
            {loading ? "🔄 Cargando..." : "🌍 Mostrar Aeropuertos"}
          </ControlButton>
          <ControlButton onClick={loadNearbyAirports} disabled={loading || !userLocation}>
            {loading ? "🔄 Cargando..." : "📍 Aeropuertos Cercanos"}
          </ControlButton>
          <p style={{ margin: "1rem 0 0 0", fontSize: "0.9rem", color: "#666" }}>
            {showNearby ? "Mostrando aeropuertos cercanos" : `Mostrando ${airports.length} aeropuertos`}
          </p>
          {userLocation && (
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", color: "#28a745" }}>
              ✅ Ubicación: {userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}
            </p>
          )}
        </MapControls>

        <StyledMapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`} // Force re-render when center/zoom changes
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationMarker onLocationFound={handleLocationFound} />

          {airports.map((airport) => {
            // Validar que el aeropuerto tenga coordenadas válidas
            if (
              !airport.latitude_deg ||
              !airport.longitude_deg ||
              isNaN(airport.latitude_deg) ||
              isNaN(airport.longitude_deg)
            ) {
              return null
            }

            return (
              <Marker
                key={`airport-${airport.id}`}
                position={[airport.latitude_deg, airport.longitude_deg]}
                eventHandlers={{
                  click: () => handleAirportClick(airport),
                }}
              >
                <Popup>
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0" }}>{airport.name}</h4>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>Código:</strong> {airport.iata_code || airport.ident}
                    </p>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>Ciudad:</strong> {airport.municipality || "N/A"}
                    </p>
                    {airport.distance_km && (
                      <p style={{ margin: "0.25rem 0" }}>
                        <strong>Distancia:</strong> {airport.distance_km.toFixed(1)} km
                      </p>
                    )}
                    <p style={{ margin: "0.5rem 0 0 0", color: "#28a745", fontSize: "0.8rem", fontWeight: "bold" }}>
                      ✅ Click registrado para popularidad
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </StyledMapContainer>
      </MapPageContainer>
    </HomeContainer>
  )
}

export default Home
