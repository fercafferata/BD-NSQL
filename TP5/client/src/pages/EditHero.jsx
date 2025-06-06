"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"

function EditHero() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    realName: "",
    yearOfAppearance: "",
    publisher: "",
    biography: "",
    equipment: "",
    images: [""],
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const response = await axios.get(`/api/heroes/${id}`)
        setFormData(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching hero details:", error)
        toast.error("Error al cargar los detalles del superhéroe")
        setLoading(false)
      }
    }

    fetchHero()
  }, [id])

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

    setSubmitting(true)

    try {
      await axios.put(`/api/heroes/${id}`, formData)
      toast.success("Superhéroe actualizado con éxito")
      navigate(`/hero/${id}`)
    } catch (error) {
      console.error("Error updating hero:", error)
      toast.error("Error al actualizar el superhéroe")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div>Cargando datos del superhéroe...</div>
  }

  return (
    <div>
      <h2>Editar Superhéroe</h2>

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
          <label>Imágenes *</label>
          {formData.images.map((image, index) => (
            <div key={index} style={{ display: "flex", marginBottom: "10px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="URL de la imagen"
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
          <Link to={`/hero/${id}`} className="cancel-btn">
            Cancelar
          </Link>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditHero
