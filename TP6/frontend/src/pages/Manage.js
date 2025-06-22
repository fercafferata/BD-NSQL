"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import AirportManager from "../components/AirportManager"
import { getAirports, searchAirportByText, searchAirportByCode } from "../services/api"

const ManageContainer = styled.div`
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

const SearchSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
`

const SearchTitle = styled.h3`
  color: white;
  margin-bottom: 1rem;
  text-align: center;
`

const SearchForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const SearchInput = styled.input`
  flex: 1;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }
`

const SearchButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const AirportList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`

const AirportCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  border: 2px solid ${(props) => (props.$selected ? "#667eea" : "rgba(255, 255, 255, 0.2)")};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: #667eea;
  }
`

const AirportName = styled.h4`
  color: white;
  margin: 0 0 0.5rem 0;
`

const AirportDetails = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
`

function Manage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedAirport, setSelectedAirport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      let results = []

      // Detectar si es código o texto
      const isCode = /^[A-Z0-9]{3,4}$/i.test(searchQuery.trim())

      if (isCode) {
        try {
          const result = await searchAirportByCode(searchQuery.trim())
          results = [result]
        } catch (error) {
          results = await searchAirportByText(searchQuery.trim(), 20)
        }
      } else {
        results = await searchAirportByText(searchQuery.trim(), 20)
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleAirportSelect = (airport) => {
    setSelectedAirport(selectedAirport?.id === airport.id ? null : airport)
  }

  const handleAirportChange = () => {
    // Trigger para refrescar la búsqueda después de cambios
    setRefreshTrigger((prev) => prev + 1)
    setSelectedAirport(null)

    // Re-ejecutar la última búsqueda si había una
    if (searchQuery.trim()) {
      handleSearch({ preventDefault: () => {} })
    }
  }

  // Cargar algunos aeropuertos iniciales
  useEffect(() => {
    const loadInitialAirports = async () => {
      try {
        const data = await getAirports(1, 12)
        if (data && data.airports) {
          setSearchResults(data.airports)
        }
      } catch (error) {
        console.error("Error cargando aeropuertos iniciales:", error)
      }
    }

    loadInitialAirports()
  }, [refreshTrigger])

  return (
    <ManageContainer>
      <Title> CRUD Aeropuertos</Title>

      <SearchSection>
        <SearchTitle>🔍 Buscar Aeropuerto</SearchTitle>
        <SearchForm onSubmit={handleSearch}>
          <SearchInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código IATA/ICAO o ciudad..."
          />
          <SearchButton type="submit" disabled={loading}>
            {loading ? "🔄 Buscando..." : "🔍 Buscar"}
          </SearchButton>
        </SearchForm>

        <AirportList>
          {searchResults.map((airport) => (
            <AirportCard
              key={airport.id}
              $selected={selectedAirport?.id === airport.id}
              onClick={() => handleAirportSelect(airport)}
            >
              <AirportName>{airport.name}</AirportName>
              <AirportDetails>
                <div>
                  <strong>Código:</strong> {airport.iata_code || airport.ident}
                </div>
                <div>
                  <strong>Ciudad:</strong> {airport.municipality}
                </div>
                <div>
                  <strong>Coordenadas:</strong> {airport.latitude_deg?.toFixed(3)}, {airport.longitude_deg?.toFixed(3)}
                </div>
              </AirportDetails>
            </AirportCard>
          ))}
        </AirportList>

        {searchResults.length === 0 && searchQuery && !loading && (
          <div style={{ color: "white", textAlign: "center", marginTop: "1rem" }}>
            No se encontraron aeropuertos para "{searchQuery}"
          </div>
        )}
      </SearchSection>

      <AirportManager selectedAirport={selectedAirport} onAirportChange={handleAirportChange} />
    </ManageContainer>
  )
}

export default Manage
