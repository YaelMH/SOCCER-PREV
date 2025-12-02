// routes/contenido.js
const express = require('express');
const router = express.Router();

/**
 * Contenido preventivo CURADO desde fuentes reales.
 * - description: resumen con tus palabras (no copiado).
 * - sourceName / sourceUrl: referencia al contenido original.
 */

const preventiveContent = [
  {
    id: 'c1',
    title: 'Programa FIFA 11+ de calentamiento para prevenir lesiones',
    description:
      'Resumen del programa FIFA 11+, un calentamiento estructurado con ejercicios de fuerza, equilibrio y control neuromuscular que ha mostrado reducir el riesgo de lesiones si se realiza de forma regular.',
    type: 'video',
    duration: '15 min',
    focusZone: 'Cuerpo completo',
    sourceName: 'FIFA – Prevención de lesiones y fomento de la salud (FIFA 11+)',
    sourceUrl: 'https://inside.fifa.com/es/health-and-medical/injury-prevention'
  },
  {
    id: 'c2',
    title: 'Prevención de lesiones de isquiotibiales en jugadores de fútbol',
    description:
      'Revisión que analiza factores de riesgo de las lesiones de isquiotibiales en fútbol y destaca el papel del trabajo de fuerza excéntrica, como el Nordic Hamstring, para reducir su incidencia.',
    type: 'articulo',
    duration: '12 min',
    focusZone: 'Isquiotibiales',
    sourceName: 'Hamstring Injuries Prevention in Soccer – Narrative Review (PMC)',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8236328/'
  },
  {
    id: 'c3',
    title: 'Relación entre carga de entrenamiento y riesgo de lesión',
    description:
      'Artículo que explica el “paradigma carga–lesión”: tanto las cargas muy bajas como las muy altas pueden incrementar el riesgo de lesión, mientras que una progresión adecuada ayuda a proteger al futbolista.',
    type: 'articulo',
    duration: '10 min',
    focusZone: 'Carga global',
    sourceName: 'Training-Injury Prevention Paradox – British Journal of Sports Medicine',
    sourceUrl: 'https://bjsm.bmj.com/content/50/5/273'
  },
  {
    id: 'c4',
    title: 'Calentamiento dinámico completo para jugadores de fútbol',
    description:
      'Video con una rutina de calentamiento dinámico de cuerpo completo, basada en movimientos activos, cambios de dirección y saltos suaves para preparar músculos y articulaciones antes del partido.',
    type: 'video',
    duration: '8 min',
    focusZone: 'Cuerpo completo',
    sourceName: 'Dynamic warm-up for soccer – YouTube',
    sourceUrl: 'https://www.youtube.com/watch?v=zV7N_7tDvh4'
  },
  {
    id: 'c5',
    title: 'Guía de calentamiento dinámico para jugadores de soccer',
    description:
      'Artículo divulgativo que resume pasos clave de un calentamiento dinámico (movilidad, fuerza, ejercicios pliométricos) para reducir el riesgo de lesión y mejorar el rendimiento.',
    type: 'articulo',
    duration: '7 min',
    focusZone: 'Cuerpo completo',
    sourceName: 'Johns Hopkins Medicine – Soccer warmups to prepare for your game',
    sourceUrl:
      'https://www.hopkinsmedicine.org/health/wellness-and-prevention/soccer-warmups-to-prepare-for-your-game'
  }
];

// GET /api/contenido-preventivo
router.get('/', (_req, res) => {
  res.json(preventiveContent);
});

module.exports = router;
