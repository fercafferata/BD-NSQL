"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import HeroCard from "../components/HeroCard"

function DCHeroes() {
  const [heroes, setHeroes] = useState([])
  const [filteredHeroes, setFilteredHeroes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await axios.get("/api/heroes/publisher/dc")
        setHeroes(response.data)
        setFilteredHeroes(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching DC heroes:", error)
        setLoading(false)
      }
    }

    fetchHeroes()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = heroes.filter((hero) => hero.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredHeroes(filtered)
    } else {
      setFilteredHeroes(heroes)
    }
  }, [searchTerm, heroes])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  if (loading) {
    return <div className="loading">Cargando superhéroes de DC...</div>
  }

  return (
    <div>
      <h2>Superhéroes de DC</h2>

      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          className="search-input"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="heroes-container">
        {filteredHeroes.length > 0 ? (
          filteredHeroes.map((hero) => <HeroCard key={hero._id} hero={hero} />)
        ) : (
          <p>No se encontraron superhéroes de DC.</p>
        )}
      </div>
    </div>
  )
}

export default DCHeroes
