// app.js
// Importa el módulo Express para crear el servidor
const express = require('express');
// Importa CORS para permitir conexiones entre frontend y backend
const cors = require('cors');

const app = express();

// CORS abierto (dev). En prod limita: cors({ origin: 'https://tu-front.com' })
app.use(cors());
// Parseo JSON
app.use(express.json());

// === Endpoints de diagnóstico ===
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});

app.post('/api/echo', (req, res) => {
  console.log('/api/echo body:', req.body);
  res.json({ you_sent: req.body, at: new Date().toISOString() });
});

// === Endpoint de recomendación (YA LO TENÍAS) ===
const recomendacionRoute = require('./routes/recomendacion');
app.use(
  '/api/recomendacion',
  (req, res, next) => {
    console.log('/api/recomendacion body:', req.body);
    next();
  },
  recomendacionRoute
);

// === NUEVO endpoint de contenido preventivo ===
const contenidoRoute = require('./routes/contenido');
app.use('/api/contenido-preventivo', contenidoRoute);

// Server
app.listen(3000, () => {
  console.log('Servidor backend escuchando en http://localhost:3000');
});
