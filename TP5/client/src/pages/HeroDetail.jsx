"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { Carousel } from "react-responsive-carousel"
import "react-responsive-carousel/lib/styles/carousel.min.css"

function HeroDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hero, setHero] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const response = await axios.get(`/api/heroes/${id}`)
        setHero(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching hero details:", error)
        toast.error("Error al cargar los detalles del superhéroe")
        setLoading(false)
      }
    }

    fetchHero()
  }, [id])

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este superhéroe?")) {
      try {
        await axios.delete(`/api/heroes/${id}`)
        toast.success("Superhéroe eliminado con éxito")
        navigate("/")
      } catch (error) {
        console.error("Error deleting hero:", error)
        toast.error("Error al eliminar el superhéroe")
      }
    }
  }

  if (loading) {
    return <div className="loading">Cargando detalles del superhéroe...</div>
  }

  if (!hero) {
    return <div>No se encontró el superhéroe.</div>
  }

  const getPublisherLogo = (publisher) => {
    return publisher.toLowerCase() === "marvel" ? "/images/marvel-logo.png" : "/images/dc-logo.png"
  }

  return (
    <div className="hero-detail">
      <div className="hero-detail-header">
        <img
          src={getPublisherLogo(hero.publisher) || "/placeholder.svg"}
          alt={`${hero.publisher} Logo`}
          className="publisher-logo"
        />
        <div>
          <h2>{hero.name}</h2>
          {hero.realName && <p className="real-name">{hero.realName}</p>}
        </div>
      </div>

      {hero.images.length > 0 && (
        <div className="hero-carousel">
          {hero.images.length > 1 ? (
            <Carousel showArrows={true} showThumbs={false} infiniteLoop={true}>
              {hero.images.map((image, index) => (
                <div key={index}>
                  <img
                    src={`/images/${image}`}
                    alt={`${hero.name} ${index + 1}`}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=400&width=600"
                    }}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <img
              src={`/images/${hero.images[0]}`}
              alt={hero.name}
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=400&width=600"
              }}
            />
          )}
        </div>
      )}

      <div className="hero-info">
        <h3>Biografía</h3>
        <p>{hero.biography}</p>
      </div>

      <div className="hero-info">
        <h3>Información Adicional</h3>
        <p>
          <strong>Año de aparición:</strong> {hero.yearOfAppearance}
        </p>
        <p>
          <strong>Casa editorial:</strong>
          <img
            src={getPublisherLogo(hero.publisher) || "/placeholder.svg"}
            alt={hero.publisher}
            className="publisher-logo-inline"
          />
        </p>
        {hero.equipment && (
          <div>
            <h3>Equipamiento</h3>
            <p>{hero.equipment}</p>
          </div>
        )}
      </div>

      <div className="hero-actions">
        <Link to={`/edit/${hero._id}`} className="edit-btn">
          Editar
        </Link>
        <button onClick={handleDelete} className="delete-btn">
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default HeroDetail
