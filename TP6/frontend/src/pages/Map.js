"use client"

import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import styled from "styled-components"
import L from "leaflet"
import { getAirports, getNearbyAirports } from "../services/api"
import "leaflet/dist/leaflet.css"

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
})

const MapPageContainer = styled.div`
  height: calc(100vh - 80px);
  position: relative;
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
`

const StyledMapContainer = styled(MapContainer)`
  height: 100%;
  width: 100%;
`

// Componente para manejar la ubicación del usuario
function LocationMarker({ onLocationFound }) {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
      onLocationFound(e.latlng)
    })
  }, [map, onLocationFound])

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Tu ubicación actual</Popup>
    </Marker>
  )
}

function Map() {
  const [airports, setAirports] = useState([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [showNearby, setShowNearby] = useState(false)

  const loadAllAirports = async () => {
    setLoading(true)
    try {
      const data = await getAirports(1, 100) // Cargar primeros 100
      setAirports(data.airports)
      setShowNearby(false)
    } catch (error) {
      console.error("Error cargando aeropuertos:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadNearbyAirports = async () => {
    if (!userLocation) {
      alert("Primero necesitas permitir acceso a tu ubicación")
      return
    }

    setLoading(true)
    try {
      const nearbyAirports = await getNearbyAirports(userLocation.lat, userLocation.lng, 200)
      setAirports(nearbyAirports)
      setShowNearby(true)
    } catch (error) {
      console.error("Error cargando aeropuertos cercanos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationFound = (latlng) => {
    setUserLocation(latlng)
  }

  useEffect(() => {
    loadAllAirports()
  }, [])

  return (
    <MapPageContainer>
      <MapControls>
        <h3 style={{ margin: "0 0 1rem 0", color: "#333" }}>Controles del Mapa</h3>
        <ControlButton onClick={loadAllAirports} disabled={loading}>
          {loading ? "Cargando..." : "Mostrar Aeropuertos"}
        </ControlButton>
        <ControlButton onClick={loadNearbyAirports} disabled={loading || !userLocation}>
          {loading ? "Cargando..." : "Aeropuertos Cercanos"}
        </ControlButton>
        <p style={{ margin: "1rem 0 0 0", fontSize: "0.9rem", color: "#666" }}>
          {showNearby ? "Mostrando aeropuertos cercanos" : `Mostrando ${airports.length} aeropuertos`}
        </p>
      </MapControls>

      <StyledMapContainer
        center={[40.4168, -3.7038]} // Madrid como centro por defecto
        zoom={6}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker onLocationFound={handleLocationFound} />

        {airports.map((airport) => (
          <Marker key={airport.id} position={[airport.latitude_deg, airport.longitude_deg]}>
            <Popup>
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0" }}>{airport.name}</h4>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Código:</strong> {airport.iata_code || airport.ident}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Ciudad:</strong> {airport.municipality}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>País:</strong> {airport.iso_country}
                </p>
                {airport.distance_km && (
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Distancia:</strong> {airport.distance_km.toFixed(1)} km
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </StyledMapContainer>
    </MapPageContainer>
  )
}

export default Map
