import express from "express"
import Hero from "../models/hero.js"

const router = express.Router()

// GET all heroes
router.get("/", async (req, res) => {
  try {
    console.log("📋 Fetching all heroes...")
    const heroes = await Hero.find()
    console.log(`✅ Found ${heroes.length} heroes`)
    res.status(200).json(heroes)
  } catch (error) {
    console.error("❌ Error fetching heroes:", error.message)
    res.status(500).json({ message: "Error al obtener superhéroes", error: error.message })
  }
})

// GET heroes by publisher
router.get("/publisher/:publisher", async (req, res) => {
  const { publisher } = req.params

  try {
    console.log(`📋 Fetching ${publisher} heroes...`)
    const heroes = await Hero.find({ publisher: publisher.toLowerCase() })
    console.log(`✅ Found ${heroes.length} ${publisher} heroes`)
    res.status(200).json(heroes)
  } catch (error) {
    console.error(`❌ Error fetching ${publisher} heroes:`, error.message)
    res.status(500).json({ message: `Error al obtener superhéroes de ${publisher}`, error: error.message })
  }
})

// GET a single hero
router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    console.log(`📋 Fetching hero with ID: ${id}`)
    const hero = await Hero.findById(id)

    if (!hero) {
      console.log(`⚠️  Hero not found with ID: ${id}`)
      return res.status(404).json({ message: "Superhéroe no encontrado" })
    }

    console.log(`✅ Found hero: ${hero.name}`)
    res.status(200).json(hero)
  } catch (error) {
    console.error(`❌ Error fetching hero ${id}:`, error.message)
    res.status(500).json({ message: "Error al obtener superhéroe", error: error.message })
  }
})

// CREATE a hero
router.post("/", async (req, res) => {
  try {
    console.log("📝 Creating new hero:", req.body.name)

    // Filtrar imágenes vacías
    const heroData = {
      ...req.body,
      images: req.body.images.filter((img) => img.trim() !== ""),
    }

    const newHero = new Hero(heroData)
    const savedHero = await newHero.save()

    console.log(`✅ Hero created successfully: ${savedHero.name}`)
    res.status(201).json(savedHero)
  } catch (error) {
    console.error("❌ Error creating hero:", error.message)
    res.status(400).json({ message: "Error al crear superhéroe", error: error.message })
  }
})

// UPDATE a hero
router.put("/:id", async (req, res) => {
  const { id } = req.params

  try {
    console.log(`📝 Updating hero with ID: ${id}`)

    // Filtrar imágenes vacías
    const heroData = {
      ...req.body,
      images: req.body.images.filter((img) => img.trim() !== ""),
    }

    const updatedHero = await Hero.findByIdAndUpdate(id, heroData, {
      new: true,
      runValidators: true,
    })

    if (!updatedHero) {
      console.log(`⚠️  Hero not found for update with ID: ${id}`)
      return res.status(404).json({ message: "Superhéroe no encontrado" })
    }

    console.log(`✅ Hero updated successfully: ${updatedHero.name}`)
    res.status(200).json(updatedHero)
  } catch (error) {
    console.error(`❌ Error updating hero ${id}:`, error.message)
    res.status(400).json({ message: "Error al actualizar superhéroe", error: error.message })
  }
})

// DELETE a hero
router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    console.log(`🗑️  Deleting hero with ID: ${id}`)
    const deletedHero = await Hero.findByIdAndDelete(id)

    if (!deletedHero) {
      console.log(`⚠️  Hero not found for deletion with ID: ${id}`)
      return res.status(404).json({ message: "Superhéroe no encontrado" })
    }

    console.log(`✅ Hero deleted successfully: ${deletedHero.name}`)
    res.status(200).json({ message: "Superhéroe eliminado correctamente" })
  } catch (error) {
    console.error(`❌ Error deleting hero ${id}:`, error.message)
    res.status(500).json({ message: "Error al eliminar superhéroe", error: error.message })
  }
})

export default router
