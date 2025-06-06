"use client"

import { useState } from "react"
import { Link } from "react-router-dom"

function HeroCard({ hero }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getPublisherLogo = (publisher) => {
    return publisher.toLowerCase() === "marvel" ? "/images/marvel-logo.png" : "/images/dc-logo.png"
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  return (
    <div className="hero-card">
      <div className="hero-card-header">
        <img
          src={getPublisherLogo(hero.publisher) || "/placeholder.svg"}
          alt={`${hero.publisher} Logo`}
          className="publisher-logo-small"
        />
      </div>

      <div className="hero-image-container">
        {!imageLoaded && (
          <div className="image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        <img
          src={imageError ? "/placeholder.svg?height=200&width=280" : hero.images[0]}
          alt={hero.name}
          className={`hero-image ${imageLoaded ? "loaded" : "loading"}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoaded ? "block" : "none" }}
        />
      </div>

      <div className="hero-card-content">
        <h3>{hero.name}</h3>
        {hero.realName && <p className="real-name">{hero.realName}</p>}
        <p className="bio">{hero.biography}</p>
        <Link to={`/hero/${hero._id}`} className="view-btn">
          Ver detalles
        </Link>
      </div>
    </div>
  )
}

export default HeroCard
