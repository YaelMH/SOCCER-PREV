// Importa el módulo Express para crear el servidor
const express = require('express');

// Importa CORS para permitir conexiones entre frontend y backend
const cors = require('cors');

// Inicializa la aplicación Express
const app = express();

// Middleware para permitir solicitudes desde otros dominios (CORS)
app.use(cors());

// Middleware para interpretar datos JSON enviados en las peticiones
app.use(express.json());

// Conecta la ruta '/api/recomendacion' con el archivo de rutas que vamos a crear
const recomendacionRoute = require('./routes/recomendacion');
app.use('/api/recomendacion', recomendacionRoute);

// Inicia el servidor en el puerto 3000 y muestra un mensaje en consola
app.listen(3000, () => {
  console.log('Servidor backend escuchando en http://localhost:3000');
});
