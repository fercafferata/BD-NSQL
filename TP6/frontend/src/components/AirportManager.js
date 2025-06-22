"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { createAirport, updateAirport, deleteAirport } from "../services/api"

const ManagerContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 2rem;
`

const ManagerTitle = styled.h3`
  color: white;
  margin-bottom: 1.5rem;
  text-align: center;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
`

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${(props) => (props.$active ? "linear-gradient(45deg, #667eea, #764ba2)" : "rgba(255, 255, 255, 0.1)")};
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: ${(props) => (props.$active ? "bold" : "normal")};
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, #667eea, #764ba2);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const FormContainer = styled.div`
  display: ${(props) => (props.$show ? "block" : "none")};
`

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`

const Label = styled.label`
  color: white;
  margin-bottom: 0.5rem;
  font-weight: bold;
  
  &.required::after {
    content: " *";
    color: #ff6b6b;
  }
`

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
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
  
  &:invalid {
    border-color: #ff6b6b;
  }
`

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }
  
  option {
    background: #333;
    color: white;
  }
`

const SubmitButton = styled.button`
  grid-column: 1 / -1;
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const DeleteButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const Message = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-weight: bold;
  background: ${(props) => (props.$type === "success" ? "rgba(40, 167, 69, 0.2)" : "rgba(220, 53, 69, 0.2)")};
  color: ${(props) => (props.$type === "success" ? "#28a745" : "#dc3545")};
  border: 1px solid ${(props) => (props.$type === "success" ? "rgba(40, 167, 69, 0.3)" : "rgba(220, 53, 69, 0.3)")};
`

const SelectedAirportInfo = styled.div`
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: white;
  text-align: center;
`

function AirportManager({ selectedAirport, onAirportChange }) {
  const [activeMode, setActiveMode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    ident: "",
    name: "",
    latitude_deg: "",
    longitude_deg: "",
    elevation_ft: "",
    continent: "Unknown",
    iso_country: "",
    iso_region: "",
    municipality: "",
    iata_code: "",
    gps_code: "",
    type: "airport",
  })

  const resetForm = () => {
    setFormData({
      ident: "",
      name: "",
      latitude_deg: "",
      longitude_deg: "",
      elevation_ft: "",
      continent: "Unknown",
      iso_country: "",
      iso_region: "",
      municipality: "",
      iata_code: "",
      gps_code: "",
      type: "airport",
    })
  }

  const loadAirportData = (airport) => {
    setFormData({
      ident: airport.ident || "",
      name: airport.name || "",
      latitude_deg: airport.latitude_deg || "",
      longitude_deg: airport.longitude_deg || "",
      elevation_ft: airport.elevation_ft || "",
      continent: airport.continent || "Unknown",
      iso_country: airport.iso_country || "",
      iso_region: airport.iso_region || "",
      municipality: airport.municipality || "",
      iata_code: airport.iata_code || "",
      gps_code: airport.gps_code || "",
      type: airport.type || "airport",
    })
  }

  const handleModeChange = (mode) => {
    setActiveMode(activeMode === mode ? null : mode)
    setMessage(null)

    if (mode === "create") {
      resetForm()
    } else if (mode === "update" && selectedAirport) {
      loadAirportData(selectedAirport)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const errors = []

    if (!formData.ident.trim()) errors.push("Código ICAO es requerido")
    if (!formData.name.trim()) errors.push("Nombre es requerido")
    if (!formData.latitude_deg) errors.push("Latitud es requerida")
    if (!formData.longitude_deg) errors.push("Longitud es requerida")

    const lat = Number.parseFloat(formData.latitude_deg)
    const lng = Number.parseFloat(formData.longitude_deg)

    if (isNaN(lat) || lat < -90 || lat > 90) errors.push("Latitud debe estar entre -90 y 90")
    if (isNaN(lng) || lng < -180 || lng > 180) errors.push("Longitud debe estar entre -180 y 180")

    if (formData.iata_code && formData.iata_code.length !== 3) {
      errors.push("Código IATA debe tener exactamente 3 caracteres")
    }

    return errors
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      setMessage({ type: "error", text: errors.join(", ") })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const newAirport = await createAirport(formData)
      setMessage({ type: "success", text: `Aeropuerto "${newAirport.name}" creado exitosamente` })
      resetForm()
      if (onAirportChange) onAirportChange()
    } catch (error) {
      console.error("Error creando aeropuerto:", error)
      setMessage({ type: "error", text: error.response?.data?.error || error.message || "Error creando aeropuerto" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedAirport) return

    const errors = validateForm()
    if (errors.length > 0) {
      setMessage({ type: "error", text: errors.join(", ") })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const updatedAirport = await updateAirport(selectedAirport.id, formData)
      setMessage({ type: "success", text: `Aeropuerto "${updatedAirport.name}" actualizado exitosamente` })
      if (onAirportChange) onAirportChange()
    } catch (error) {
      console.error("Error actualizando aeropuerto:", error)
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.message || "Error actualizando aeropuerto",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAirport) return

    if (
      !window.confirm(
        `¿Estás seguro de eliminar el aeropuerto "${selectedAirport.name}"?\n\nEsta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await deleteAirport(selectedAirport.id)
      setMessage({ type: "success", text: `Aeropuerto "${selectedAirport.name}" eliminado exitosamente` })
      if (onAirportChange) onAirportChange()
    } catch (error) {
      console.error("Error eliminando aeropuerto:", error)
      setMessage({ type: "error", text: error.response?.data?.error || error.message || "Error eliminando aeropuerto" })
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos del aeropuerto seleccionado cuando cambie
  useEffect(() => {
    if (selectedAirport && activeMode === "update") {
      loadAirportData(selectedAirport)
    }
  }, [selectedAirport, activeMode])

  return (
    <ManagerContainer>
      <ManagerTitle>🛠️ Gestión de Aeropuertos</ManagerTitle>

      <ButtonGroup>
        <ActionButton $active={activeMode === "create"} onClick={() => handleModeChange("create")} disabled={loading}>
          ➕ Crear Aeropuerto
        </ActionButton>
        <ActionButton
          $active={activeMode === "update"}
          onClick={() => handleModeChange("update")}
          disabled={!selectedAirport || loading}
        >
          ✏️ Modificar Aeropuerto
        </ActionButton>
        <DeleteButton onClick={handleDelete} disabled={!selectedAirport || loading}>
          {loading ? "⏳ Eliminando..." : "🗑️ Eliminar Aeropuerto"}
        </DeleteButton>
      </ButtonGroup>

      {selectedAirport && (
        <SelectedAirportInfo>
          <strong>📍 Aeropuerto seleccionado:</strong> {selectedAirport.name} (
          {selectedAirport.iata_code || selectedAirport.ident})
          <br />
          <small>
            ID: {selectedAirport.id} | Ciudad: {selectedAirport.municipality} | País: {selectedAirport.iso_country}
          </small>
        </SelectedAirportInfo>
      )}

      {/* FORMULARIO DE CREACIÓN */}
      <FormContainer $show={activeMode === "create"}>
        <h4 style={{ color: "white", marginBottom: "1rem" }}>➕ Crear Nuevo Aeropuerto</h4>
        <Form onSubmit={handleCreate}>
          <FormGroup>
            <Label className="required">Código ICAO/Ident</Label>
            <Input
              type="text"
              name="ident"
              value={formData.ident}
              onChange={handleInputChange}
              placeholder="Ej: KJFK"
              maxLength="4"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label className="required">Nombre del Aeropuerto</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej: John F Kennedy International Airport"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label className="required">Latitud</Label>
            <Input
              type="number"
              step="any"
              name="latitude_deg"
              value={formData.latitude_deg}
              onChange={handleInputChange}
              placeholder="Ej: 40.6413"
              min="-90"
              max="90"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label className="required">Longitud</Label>
            <Input
              type="number"
              step="any"
              name="longitude_deg"
              value={formData.longitude_deg}
              onChange={handleInputChange}
              placeholder="Ej: -73.7781"
              min="-180"
              max="180"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Elevación (pies)</Label>
            <Input
              type="number"
              name="elevation_ft"
              value={formData.elevation_ft}
              onChange={handleInputChange}
              placeholder="Ej: 13"
            />
          </FormGroup>

          <FormGroup>
            <Label>Tipo</Label>
            <Select name="type" value={formData.type} onChange={handleInputChange}>
              <option value="airport">Aeropuerto</option>
              <option value="heliport">Helipuerto</option>
              <option value="seaplane_base">Base de Hidroaviones</option>
              <option value="balloonport">Puerto de Globos</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>País (ISO)</Label>
            <Input
              type="text"
              name="iso_country"
              value={formData.iso_country}
              onChange={handleInputChange}
              placeholder="Ej: US"
              maxLength="2"
            />
          </FormGroup>

          <FormGroup>
            <Label>Ciudad</Label>
            <Input
              type="text"
              name="municipality"
              value={formData.municipality}
              onChange={handleInputChange}
              placeholder="Ej: New York"
            />
          </FormGroup>

          <FormGroup>
            <Label>Código IATA (opcional)</Label>
            <Input
              type="text"
              name="iata_code"
              value={formData.iata_code}
              onChange={handleInputChange}
              placeholder="Ej: JFK"
              maxLength="3"
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? "⏳ Creando..." : "✅ Crear Aeropuerto"}
          </SubmitButton>
        </Form>
      </FormContainer>

      {/* FORMULARIO DE ACTUALIZACIÓN */}
      <FormContainer $show={activeMode === "update"}>
        <h4 style={{ color: "white", marginBottom: "1rem" }}>✏️ Modificar Aeropuerto</h4>
        <Form onSubmit={handleUpdate}>
          <FormGroup>
            <Label className="required">Código ICAO/Ident</Label>
            <Input
              type="text"
              name="ident"
              value={formData.ident}
              onChange={handleInputChange}
              maxLength="4"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label className="required">Nombre del Aeropuerto</Label>
            <Input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
          </FormGroup>

          <FormGroup>
            <Label className="required">Latitud</Label>
            <Input
              type="number"
              step="any"
              name="latitude_deg"
              value={formData.latitude_deg}
              onChange={handleInputChange}
              min="-90"
              max="90"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label className="required">Longitud</Label>
            <Input
              type="number"
              step="any"
              name="longitude_deg"
              value={formData.longitude_deg}
              onChange={handleInputChange}
              min="-180"
              max="180"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Elevación (pies)</Label>
            <Input type="number" name="elevation_ft" value={formData.elevation_ft} onChange={handleInputChange} />
          </FormGroup>

          <FormGroup>
            <Label>Tipo</Label>
            <Select name="type" value={formData.type} onChange={handleInputChange}>
              <option value="airport">Aeropuerto</option>
              <option value="heliport">Helipuerto</option>
              <option value="seaplane_base">Base de Hidroaviones</option>
              <option value="balloonport">Puerto de Globos</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>País (ISO)</Label>
            <Input
              type="text"
              name="iso_country"
              value={formData.iso_country}
              onChange={handleInputChange}
              maxLength="2"
            />
          </FormGroup>

          <FormGroup>
            <Label>Ciudad</Label>
            <Input type="text" name="municipality" value={formData.municipality} onChange={handleInputChange} />
          </FormGroup>

          <FormGroup>
            <Label>Código IATA (opcional)</Label>
            <Input type="text" name="iata_code" value={formData.iata_code} onChange={handleInputChange} maxLength="3" />
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? "⏳ Actualizando..." : "✅ Actualizar Aeropuerto"}
          </SubmitButton>
        </Form>
      </FormContainer>

      {message && <Message $type={message.type}>{message.text}</Message>}
    </ManagerContainer>
  )
}

export default AirportManager
