"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import styled from "styled-components"
import L from "leaflet"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
import "leaflet/dist/leaflet.css"

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const ResultsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`

const Title = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`

const MapSection = styled.div`
  height: 500px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
`

const StyledMapContainer = styled(MapContainer)`
  height: 100%;
  width: 100%;
  border-radius: 10px;
`

const ResultsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
`

const AirportCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
`

const AirportName = styled.h3`
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  line-height: 1.3;
`

const AirportCode = styled.div`
  color: #667eea;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 1rem;
`

const AirportDetails = styled.div`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
`

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const BackButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
`

function SearchResults({ results, onBack }) {
  // Calcular centro del mapa basado en los resultados
  const getMapCenter = () => {
    if (!results || results.length === 0) return [20, 0]

    const validResults = results.filter((r) => r.latitude_deg && r.longitude_deg)
    if (validResults.length === 0) return [20, 0]

    const avgLat = validResults.reduce((sum, r) => sum + r.latitude_deg, 0) / validResults.length
    const avgLng = validResults.reduce((sum, r) => sum + r.longitude_deg, 0) / validResults.length

    return [avgLat, avgLng]
  }

  const getMapZoom = () => {
    if (!results || results.length <= 1) return 8
    return 6 // Zoom para mostrar múltiples resultados
  }

  if (!results || results.length === 0) {
    return (
      <ResultsContainer>
        <Title>🔍 Resultados de Búsqueda</Title>
        <div style={{ color: "white", textAlign: "center", padding: "3rem" }}>
          <h3>❌ No se encontraron resultados</h3>
          <p>Intenta con otro término de búsqueda</p>
          <BackButton onClick={onBack}>← Volver a buscar</BackButton>
        </div>
      </ResultsContainer>
    )
  }

  return (
    <ResultsContainer>
      <Title>🔍 Resultados de Búsqueda</Title>

      <BackButton onClick={onBack}>← Nueva búsqueda</BackButton>

      {/* Mapa con resultados */}
      <MapSection>
        <StyledMapContainer center={getMapCenter()} zoom={getMapZoom()} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {results
            .filter((airport) => airport.latitude_deg && airport.longitude_deg)
            .map((airport) => (
              <Marker key={airport.id} position={[airport.latitude_deg, airport.longitude_deg]}>
                <Popup>
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>{airport.name}</h4>
                    <p style={{ margin: "0.25rem 0", color: "#666" }}>
                      <strong>Código:</strong> {airport.iata_code || airport.ident}
                    </p>
                    <p style={{ margin: "0.25rem 0", color: "#666" }}>
                      <strong>Ciudad:</strong> {airport.municipality || "N/A"}
                    </p>
                    <p style={{ margin: "0.25rem 0", color: "#666" }}>
                      <strong>País:</strong> {airport.iso_country}
                    </p>
                    {airport.distance_km && (
                      <p style={{ margin: "0.25rem 0", color: "#666" }}>
                        <strong>Distancia:</strong> {airport.distance_km.toFixed(1)} km
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        </StyledMapContainer>
      </MapSection>

      {/* Lista de resultados */}
      <div style={{ color: "white", textAlign: "center", marginBottom: "2rem" }}>
        <h2>{results.length === 1 ? "1 aeropuerto encontrado" : `${results.length} aeropuertos encontrados`}</h2>
      </div>

      <ResultsList>
        {results.map((airport) => (
          <AirportCard key={airport.id}>
            <AirportName>{airport.name}</AirportName>
            <AirportCode>
              {airport.iata_code && `${airport.iata_code} • `}
              {airport.ident}
            </AirportCode>

            <AirportDetails>
              <DetailRow>
                <span>🏙️ Ciudad:</span>
                <span>{airport.municipality || "N/A"}</span>
              </DetailRow>
              <DetailRow>
                <span>🌍 País:</span>
                <span>{airport.iso_country}</span>
              </DetailRow>
              <DetailRow>
                <span>📍 Coordenadas:</span>
                <span>
                  {airport.latitude_deg?.toFixed(2)}, {airport.longitude_deg?.toFixed(2)}
                </span>
              </DetailRow>
              <DetailRow>
                <span>✈️ Tipo:</span>
                <span>{airport.type}</span>
              </DetailRow>
              {airport.elevation_ft && (
                <DetailRow>
                  <span>⛰️ Elevación:</span>
                  <span>{airport.elevation_ft} ft</span>
                </DetailRow>
              )}
              {airport.distance_km && (
                <DetailRow>
                  <span>📏 Distancia:</span>
                  <span>{airport.distance_km.toFixed(1)} km</span>
                </DetailRow>
              )}
            </AirportDetails>
          </AirportCard>
        ))}
      </ResultsList>
    </ResultsContainer>
  )
}

export default SearchResults
