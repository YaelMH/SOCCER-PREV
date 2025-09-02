// Importa Express para poder crear rutas
const express = require('express');
// Importa PythonShell para ejecutar scripts Python desde Node.js
const { PythonShell } = require('python-shell');
// Crea un nuevo router de Express
const router = express.Router();

// Ruta POST que recibe datos del usuario y genera una recomendación
router.post('/', (req, res) => {
  const datos = req.body;// Captura los datos enviados por el frontend
  // Ejecuta el script Python con los datos como argumento
  PythonShell.run('ml/predict.py', {
    args: [JSON.stringify(datos)]
  }, (err, results) => {
    if (err) {
      console.error('❌ Error al ejecutar el modelo:', err);
      return res.status(500).json({ error: 'Error al generar predicción' });
    }
    // Interpreta la predicción y envía la recomendación como respuesta
    const resultado = results[0]; // Devuelve texto como por ejemplo "Esguince" y se tendrá una clasificación
    res.json({ resultado });
  });
});

module.exports = router;

