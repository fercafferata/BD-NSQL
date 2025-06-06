"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"

function CreateHero() {
  const navigate = useNavigate()
  const [availableImages, setAvailableImages] = useState({ heroes: [], logos: [] })
  const [formData, setFormData] = useState({
    name: "",
    realName: "",
    yearOfAppearance: "",
    publisher: "marvel",
    biography: "",
    equipment: "",
    images: [""],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Cargar lista de imágenes disponibles
    const fetchImages = async () => {
      try {
        const response = await axios.get("/api/images")
        setAvailableImages(response.data)
      } catch (error) {
        console.error("Error fetching images:", error)
      }
    }
    fetchImages()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images]
    updatedImages[index] = value
    setFormData({
      ...formData,
      images: updatedImages,
    })
  }

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, ""],
    })
  }

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const updatedImages = formData.images.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        images: updatedImages,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validación básica
    if (!formData.name || !formData.biography || !formData.yearOfAppearance || !formData.images[0]) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/heroes", formData)
      toast.success("Superhéroe creado con éxito")
      navigate("/")
    } catch (error) {
      console.error("Error creating hero:", error)
      toast.error("Error al crear el superhéroe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Crear Nuevo Superhéroe</h2>

      <form onSubmit={handleSubmit} className="hero-form">
        <div className="form-group">
          <label htmlFor="name">Nombre *</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="realName">Nombre Real</label>
          <input
            type="text"
            id="realName"
            name="realName"
            className="form-control"
            value={formData.realName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="yearOfAppearance">Año de Aparición *</label>
          <input
            type="number"
            id="yearOfAppearance"
            name="yearOfAppearance"
            className="form-control"
            value={formData.yearOfAppearance}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="publisher">Casa Editorial *</label>
          <select
            id="publisher"
            name="publisher"
            className="form-control"
            value={formData.publisher}
            onChange={handleChange}
            required
          >
            <option value="marvel">Marvel</option>
            <option value="dc">DC</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="biography">Biografía *</label>
          <textarea
            id="biography"
            name="biography"
            className="form-control"
            value={formData.biography}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="equipment">Equipamiento</label>
          <textarea
            id="equipment"
            name="equipment"
            className="form-control"
            value={formData.equipment}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Imágenes del Superhéroe * (solo escribir el nombre del archivo)</label>
          {availableImages.heroes.length > 0 && (
            <div className="available-images">
              <p>
                <strong>Imágenes disponibles:</strong> {availableImages.heroes.join(", ")}
              </p>
            </div>
          )}
          {formData.images.map((image, index) => (
            <div key={index} style={{ display: "flex", marginBottom: "10px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Ejemplo: spiderman1.jpg"
                value={image}
                onChange={(e) => handleImageChange(index, e.target.value)}
                required={index === 0}
                style={{ marginRight: "10px" }}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  style={{
                    padding: "0 10px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  X
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageField}
            style={{ padding: "5px 10px", background: "#2196F3", color: "white", border: "none", borderRadius: "4px" }}
          >
            Añadir otra imagen
          </button>
        </div>

        <div className="form-actions">
          <Link to="/" className="cancel-btn">
            Cancelar
          </Link>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Creando..." : "Crear Superhéroe"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateHero
