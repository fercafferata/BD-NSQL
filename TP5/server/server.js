import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import heroRoutes from "./routes/heroes.js"
import { initializeData } from "./utils/initData.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(cors())
app.use(express.json())

// Ruta de prueba para verificar que el servidor funciona
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running", timestamp: new Date().toISOString() })
})

// Ruta para listar imágenes disponibles (simulada - las imágenes están en el cliente)
app.get("/api/images", (req, res) => {
  // Lista de imágenes disponibles en el cliente
  const availableImages = {
    heroes: [
      "amethyst.jpg",
      "aztek.jpg",
      "batman.jpg",
      "blackcanary.jpg",
      "blackwidow.jpg",
      "bluebeetle.jpg",
      "bluemarvel.jpg",
      "darkhawk.jpg",
      "doctor-midnite.jpg",
      "elsabloodstone.jpg",
      "fantasma.jpg",
      "firestorm.jpg",
      "flash.jpg",
      "geo-force.jpg",
      "hawkman.jpg",
      "hellcat.jpg",
      "hulk.jpg",
      "husk.jpg",
      "ironman.jpg",
      "karma.jpg",
      "linternaverde.jpg",
      "man-wolf.jpg",
      "moonknight.jpg",
      "moonstone.jpg",
      "mujermaravilla.jpg",
      "nicominoru.jpg",
      "nova.jpg",
      "phantomstranger.jpg",
      "plasticman.jpg",
      "ragman.jpg",
      "shangchi.jpg",
      "shazam.jpg",
      "shehulk.jpg",
      "songbird.jpg",
      "spiderman.jpg",
      "squirrelgirl.jpg",
      "stingray.jpg",
      "superman.jpg",
      "thequestions.jpg",
      "theray.jpg",
      "thor.jpg",
      "vixen.jpg",
      "whitetiger.jpg",
      "zatanna.jpg",
      "zauriel.jpg",
    ],
    logos: ["marvel-logo.png", "dc-logo.png"],
  }
  res.json(availableImages)
})

// API Routes
app.use("/api/heroes", heroRoutes)

// Servir archivos estáticos del frontend
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "public")
  app.use(express.static(clientBuildPath))

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"))
  })
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Superheroes API is running in development mode" })
  })
}

// MongoDB Connection con inicialización automática de datos
const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...")
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ Connected to MongoDB successfully")

    // Inicializar datos automáticamente si la base de datos está vacía
    await initializeData()
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message)
    process.exit(1)
  }
}

// Conexión a MongoDB y inicio del servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port: ${PORT}`)
    console.log(`📝 Health check available at: http://localhost:${PORT}/api/health`)
    console.log(`🖼️  Images served from client: /images/`)
    if (process.env.NODE_ENV === "production") {
      console.log(`🌐 Application available at: http://localhost:${PORT}`)
    }
  })
})

// Manejo de errores de MongoDB
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err)
})

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected")
})
