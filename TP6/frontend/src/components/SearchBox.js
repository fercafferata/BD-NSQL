"use client"

import { useState } from "react"
import styled from "styled-components"
import { searchAirportByCode, searchAirportByText } from "../services/api"

const SearchContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
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
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  &:focus {
    outline: none;
    box-shadow: 0 4px 25px rgba(102, 126, 234, 0.3);
  }
  
  &::placeholder {
    color: #999;
  }
`

const SearchButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const SearchHint = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  text-align: center;
  margin: 0;
`

// Función para detectar si es un código IATA/ICAO
function isAirportCode(query) {
  const trimmed = query.trim().toUpperCase()
  // IATA: 3 letras, ICAO: 4 letras/números
  return /^[A-Z]{3}$/.test(trimmed) || /^[A-Z0-9]{4}$/.test(trimmed)
}

function SearchBox({ onResults }) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      let results = []

      // Detectar automáticamente si es código o texto
      if (isAirportCode(query)) {
        // Buscar por código IATA/ICAO internamente
        try {
          const result = await searchAirportByCode(query.trim())
          results = [result]
        } catch (error) {
          // Si no encuentra por código, buscar por texto
          results = await searchAirportByText(query.trim())
        }
      } else {
        // Buscar por texto libre
        results = await searchAirportByText(query.trim())
      }

      onResults(results)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      onResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SearchContainer>
      <SearchForm onSubmit={handleSubmit}>
        <SearchInput
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar aeropuerto por nombre, ciudad o país..."
        />
        <SearchButton type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </SearchButton>
      </SearchForm>
      <SearchHint>Ejemplo: "Madrid", "Barcelona", "JFK", "Londres Heathrow"</SearchHint>
    </SearchContainer>
  )
}

export default SearchBox
