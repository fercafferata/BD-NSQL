"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import styled from "styled-components"
import SearchBox from "../components/SearchBox"
import SearchResults from "./SearchResults"

const SearchContainer = styled.div`
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

const ResultsContainer = styled.div`
  margin-top: 3rem;
`

const NoResults = styled.div`
  text-align: center;
  color: white;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`

function Search() {
  const [results, setResults] = useState([])
  const location = useLocation()

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results)
    }
  }, [location.state])

  const handleSearch = (searchResults) => {
    setResults(searchResults)
  }

  const handleBackToSearch = () => {
    setResults([])
  }

  // Si hay resultados, mostrar SearchResults
  if (results.length > 0) {
    return <SearchResults results={results} onBack={handleBackToSearch} />
  }

  // Si no hay resultados, mostrar la página de búsqueda normal
  return (
    <SearchContainer>
      <Title>🔍 Buscar Aeropuertos</Title>
      <SearchBox onResults={handleSearch} />

      {results.length === 0 && location.state?.results && (
        <ResultsContainer>
          <NoResults>
            <h3>❌ No se encontraron resultados</h3>
            <p>Intenta con otro término de búsqueda</p>
          </NoResults>
        </ResultsContainer>
      )}
    </SearchContainer>
  )
}

export default Search
