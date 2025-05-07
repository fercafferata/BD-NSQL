const express = require('express');
const redis = require('redis');
const path = require('path');
const exphbs = require('express-handlebars');

const app = express();
const client = redis.createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});

// Conexión a Redis
(async () => {
  try {
    await client.connect();
    console.log('✅ Conectado a Redis correctamente');
  } catch (err) {
    console.error('❌ Error de conexión con Redis:', err);
  }
})();

// Configurar Handlebars con helper json
const hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout: false,
  helpers: {
    // Helper para convertir objetos a JSON en la plantilla
    json: function(context) {
      return JSON.stringify(context);
    }
  }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'templates')); // Asegúrate de que tus plantillas estén en la carpeta 'templates'

// Middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal - Mapa con todos los puntos
app.get('/', async (req, res) => {
  const grupos = ['cervecerias', 'universidades', 'farmacias', 'emergencias', 'supermercados'];
  const puntos = {};

  for (const grupo of grupos) {
    const miembros = await client.zRange(grupo, 0, -1);
    puntos[grupo] = [];

    for (const miembro of miembros) {
      const coords = await client.geoPos(grupo, miembro);
      if (coords && coords[0]) {
        puntos[grupo].push({
          nombre: miembro,
          longitud: coords[0].longitude,
          latitud: coords[0].latitude
        });
      }
    }
  }

  res.render('index', { puntos });
});

// Ruta para cargar nuevos puntos
app.get('/cargar', async (req, res) => {
  const { select: grupo, nombre, longitud, latitud } = req.query;
  let success = false;

  if (grupo && nombre && longitud && latitud) {
    try {
      await client.geoAdd(grupo, {
        longitude: parseFloat(longitud),
        latitude: parseFloat(latitud),
        member: nombre
      });
      console.log(`✅ Agregado a ${grupo}: ${nombre} (${latitud}, ${longitud})`);
      success = true;
    } catch (error) {
      console.error('Error al agregar punto:', error);
    }
  }

  res.render('cargar', { success });
});

// Ruta para buscar puntos en un radio de 5km
app.get('/location5km', async (req, res) => {
  const { latitud, longitud } = req.query;
  const grupos = ['cervecerias', 'universidades', 'farmacias', 'emergencias', 'supermercados'];
  
  // Objeto para almacenar los resultados por categoría
  const resultadosPorCategoria = {
    cervecerias: [],
    universidades: [],
    farmacias: [],
    emergencias: [],
    supermercados: []
  };

  if (latitud && longitud) {
    try {
      const lat = parseFloat(latitud);
      const lon = parseFloat(longitud);
      
      // Verificar que los valores son números válidos
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Latitud o longitud no son números válidos');
      }
      
      for (const grupo of grupos) {
        try {
          // Verificar primero si el grupo existe en Redis
          const miembros = await client.zRange(grupo, 0, -1);
          
          if (miembros && miembros.length > 0) {
            // Usar GEORADIUS directamente en lugar de geoRadius
            const lugares = await client.sendCommand([
              'GEORADIUS', 
              grupo, 
              lon.toString(), 
              lat.toString(), 
              '5', 
              'km', 
              'WITHDIST'
            ]);
            
            // Formatear los resultados para la plantilla
            const resultadosFormateados = lugares ? lugares.map(item => {
              // item[0] es el nombre, item[1] es la distancia
              return [item[0], parseFloat(item[1])];
            }) : [];
            
            resultadosPorCategoria[grupo] = resultadosFormateados;
          }
        } catch (error) {
          console.error(`Error al buscar en ${grupo}:`, error);
          // Continuar con el siguiente grupo en caso de error
        }
      }
    } catch (error) {
      console.error('Error al procesar la búsqueda:', error);
    }
  }

  // Pasar los resultados a la plantilla en el formato esperado
  res.render('location5km', {
    cervecerias: resultadosPorCategoria.cervecerias,
    universidades: resultadosPorCategoria.universidades,
    farmacias: resultadosPorCategoria.farmacias,
    emergencias: resultadosPorCategoria.emergencias,
    supermercados: resultadosPorCategoria.supermercados
  });
});

// Iniciar servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Node.js corriendo en http://localhost:${PORT}`);
});