"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { getPopularAirports } from "../services/api"

const PopularContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`

const Title = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`

const AirportGrid = styled.div`
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

const AirportRank = styled.div`
  position: absolute;
  top: -10px;
  left: -10px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
`

const CardHeader = styled.div`
  position: relative;
  margin-bottom: 1rem;
`

const AirportName = styled.h3`
  color: white;
  margin: 0 0 0.5rem 0;
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

const PopularityScore = styled.div`
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  text-align: center;
  margin-top: 1rem;
  font-weight: bold;
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  color: white;
  font-size: 1.2rem;
`

const ErrorContainer = styled.div`
  text-align: center;
  color: white;
  padding: 2rem;
`

function Popular() {
  const [airports, setAirports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPopularAirports = async () => {
      try {
        setLoading(true)
        const data = await getPopularAirports(20)
        setAirports(data)
      } catch (err) {
        setError("Error al cargar aeropuertos populares")
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPopularAirports()
  }, [])

  if (loading) {
    return (
      <LoadingContainer>
        <div>Cargando aeropuertos populares...</div>
      </LoadingContainer>
    )
  }

  if (error) {
    return (
      <ErrorContainer>
        <h2>{error}</h2>
        <p>Por favor, intenta nuevamente más tarde.</p>
      </ErrorContainer>
    )
  }

  if (airports.length === 0) {
    return (
      <ErrorContainer>
        <h2>No hay datos de popularidad disponibles</h2>
        <p>Los aeropuertos aparecerán aquí una vez que sean buscados.</p>
      </ErrorContainer>
    )
  }

  return (
    <PopularContainer>
      <Title>Aeropuertos Más Populares</Title>

      <AirportGrid>
        {airports.map((airport, index) => (
          <AirportCard key={airport.id}>
            <CardHeader>
              <AirportRank>{index + 1}</AirportRank>
              <AirportName>{airport.name}</AirportName>
              <AirportCode>
                {airport.iata_code && `${airport.iata_code} • `}
                {airport.ident}
              </AirportCode>
            </CardHeader>

            <AirportDetails>
              <DetailRow>
                <span>Ciudad:</span>
                <span>{airport.municipality || "N/A"}</span>
              </DetailRow>
              <DetailRow>
                <span>País:</span>
                <span>{airport.iso_country}</span>
              </DetailRow>
              <DetailRow>
                <span>Coordenadas:</span>
                <span>
                  {airport.latitude_deg.toFixed(2)}, {airport.longitude_deg.toFixed(2)}
                </span>
              </DetailRow>
              {airport.elevation_ft && (
                <DetailRow>
                  <span>Elevación:</span>
                  <span>{airport.elevation_ft} ft</span>
                </DetailRow>
              )}
            </AirportDetails>

            <PopularityScore>{airport.popularity_score} búsquedas</PopularityScore>
          </AirportCard>
        ))}
      </AirportGrid>
    </PopularContainer>
  )
}

export default Popular
