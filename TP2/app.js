const express = require('express');
const redis = require('redis');
const path = require('path');

const app = express();
const client = redis.createClient();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

client.connect();

// Ruta principal para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Obtener todos los capítulos agrupados por temporada
app.get('/listar', async (req, res) => {
  const keys = await client.keys('episodio:*');
  const resultado = {};

  for (const key of keys) {
    const capRaw = await client.get(key);
    if (!capRaw) continue;

    const cap = JSON.parse(capRaw);
    const { temporada } = cap;

    if (!resultado[temporada]) {
      resultado[temporada] = [];
    }

    resultado[temporada].push(cap);
  }

  // Ordenar capítulos por número de episodio
  for (const temp in resultado) {
    resultado[temp].sort((a, b) => a.episodio - b.episodio);
  }

  res.json(resultado);
});

// Reservar un capítulo (por 4 minutos)
app.post('/alquilar', async (req, res) => {
  const { temporada, capitulo } = req.body;
  const key = `episodio:${temporada}:${capitulo}`;

  const capRaw = await client.get(key);
  if (!capRaw) return res.status(400).json({ error: "Episodio no encontrado" });

  const cap = JSON.parse(capRaw);
  if (cap.estado !== 'disponible') {
    return res.status(400).json({ error: 'Episodio no disponible' });
  }

  cap.estado = 'reservado';
  await client.setEx(key, 240, JSON.stringify(cap)); // 4 minutos = 240 segundos

  res.json({ mensaje: 'Capítulo reservado por 4 minutos' });
});

// Confirmar pago (alquila el capítulo por 24 horas)
app.post('/confirmar', async (req, res) => {
  const { temporada, capitulo } = req.body;
  const key = `episodio:${temporada}:${capitulo}`;

  const capRaw = await client.get(key);
  if (!capRaw) return res.status(400).json({ error: "Episodio no encontrado" });

  const cap = JSON.parse(capRaw);
  if (cap.estado !== 'reservado') {
    return res.status(400).json({ error: 'Episodio no está reservado' });
  }

  cap.estado = 'alquilado';
  await client.setEx(key, 86400, JSON.stringify(cap)); // 24 horas

  res.json({ mensaje: 'Pago confirmado, episodio alquilado por 24 hs' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
