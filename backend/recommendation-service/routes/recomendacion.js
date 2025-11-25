/*
 * En este endpoint se construye la recomendación final para el usuario.
 * La decisión principal de GRAVEDAD la estamos basando en la sensación del usuario:
 *   - dolor_nivel (1–10)
 *   - dolor_zona  (texto libre y lo normalizamos a zonas típicas)
 *   - dolor_dias  (duración en días)
 *
 * Si el modelo falla o tarda, igual se busca que devuelva una respuesta basada en dolor.
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();


/** Normalizar: se quitan nulos, se recorta y paso a minúsculas. */
function normStr(v) { return (v ?? '').toString().trim().toLowerCase(); }

/** Devuelve fecha local para mostrar ya cuando tengamos el front y también ISO por si la guardo en BD. */
function fechaAhora() {
  const d = new Date();
  return { iso: d.toISOString(), local: d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) };
}

/* Zonas tipo
 * Esta parte NO sustituye al modelo; solo me ayuda a orientar  el modelo responde "Otra lesión".
 */

/** Mapeo entradas libres de zona a etiquetas controladas. */
function normalizaZona(z) {
  z = normStr(z);
  if (!z) return 'desconocida';
  if (z.includes('tobillo')) return 'tobillo';
  if (z.includes('rodilla')) return 'rodilla';
  if (z.includes('isqu') || z.includes('isqui')) return 'isquiotibiales';
  if (z.includes('muslo') && (z.includes('ant') || z.includes('cuad'))) return 'cuadriceps';
  if (z.includes('muslo')) return 'muslo';
  if (z.includes('pantorr') || z.includes('gemelo')) return 'pantorrilla';
  if (z.includes('ingle') || z.includes('aductor')) return 'ingle';
  if (z.includes('cadera')) return 'cadera';
  if (z.includes('espalda') || z.includes('lumba')) return 'espalda';
  if (z.includes('hombro')) return 'hombro';
  if (z.includes('muñec') || z.includes('man') || z.includes('dedo')) return 'mano_muñeca';
  if (z.includes('pie')) return 'pie';
  return z; // si no la reconoce, se deja tal cual se ingreso
}

/** Por zona (ya normalizada) sugiero un tipo genérico. */
function tipoSugeridoPorZona(zonaNorm) {
  const mapa = {
    tobillo: 'Esguince',
    rodilla: 'Esguince',           // podría ser menisco/ligamento, lo dejo genérico
    isquiotibiales: 'Desgarre',
    cuadriceps: 'Desgarre',
    muslo: 'Desgarre',
    pantorrilla: 'Desgarre',
    ingle: 'Desgarre',
    hombro: 'Luxación',            // típico si “se zafó” o hubo impacto
    mano_muñeca: 'Otra lesión',    // contusión/tendinopatía (o fractura si trauma fuerte)
    pie: 'Otra lesión',
    cadera: 'Otra lesión',
    espalda: 'Otra lesión'
  };
  return mapa[zonaNorm] || 'Otra lesión';
}

/*
 * La GRAVEDAD la definimos principalmente con nivel/duración del dolor o si es una fuerte lesión que tenga urgencia medica.
 *   - nivel ≥ 8  o días ≥ 14  -Alta
 *   - nivel 5–7 o días 7–13   -Media
 *   - resto                   -Baja
 * Si el tipo final es “Fractura” o “Luxación”, fuerzo “Alta”.
 */
function gravedadPorDolor(nivel, dias, tipoFinal) {
  const n = Number(nivel) || 0;
  const d = Number(dias) || 0;

  // Si el tipo implica urgencia por definición, priorizo Alta.
  if (tipoFinal === 'Fractura' || tipoFinal === 'Luxación') return 'Alta';

  if (n >= 8 || d >= 14) return 'Alta';
  if (n >= 5 || d >= 7) return 'Media';
  return 'Baja';
}

//NIVEL DE URGENCIA
function debeAcudirEspecialista(tipoFinal, gravedad, nivelDolor, diasDolor, zona) {
  // Urgencia inmediata si sospecho fractura o luxación.
  if (tipoFinal === 'Fractura' || tipoFinal === 'Luxación') {
    return { necesario: true, urgente: true, motivo: 'Sospecha de daño óseo/articular. Requiere valoración inmediata.' };
  }
  // Dolor muy intenso o gravedad alta → sugerir valoración (no urgente).
  if (gravedad === 'Alta' || Number(nivelDolor) >= 8) {
    return { necesario: true, urgente: false, motivo: 'Dolor intenso o persistente. Recomendada valoración clínica/fisioterapia.' };
  }
  // Articulaciones clave con dolor que no cede en 10 días "sugerir valoración".
  const zonasCríticas = ['rodilla', 'hombro', 'tobillo'];
  if (zonasCríticas.includes(zona) && Number(diasDolor) >= 10) {
    return { necesario: true, urgente: false, motivo: 'Dolor persistente en articulación clave. Sugerida valoración.' };
  }
  // Caso leve/reciente  "autocuidado y vigilancia 48–72 h".
  return { necesario: false, urgente: false, motivo: 'Si no mejora en 48–72 h o empeora, buscar valoración.' };
}

/** Generamos un texto corto que combine tipo + zona + intensidad/tiempo. */
function descripcionPorTipo(tipoFinal, zona, nivel, dias) {
  const base = {
    'Esguince': 'Lesión de ligamentos por torsión/inestabilidad articular.',
    'Desgarre': 'Ruptura parcial de fibras musculares por sobrecarga o arranque.',
    'Fractura': 'Rotura ósea (dolor intenso y posible incapacidad funcional).',
    'Luxación': 'Pérdida de congruencia articular (se “zafa” la articulación).',
    'Otra lesión': 'Molestia inespecífica (contusión, tendinopatía u otra).'
  };
  const ztxt = zona !== 'desconocida'
    ? ` Reportas dolor en ${zona} (intensidad ${nivel}/10, ${dias} día(s)).`
    : ` Intensidad ${nivel}/10, ${dias} día(s).`;
  return (base[tipoFinal] || base['Otra lesión']) + ztxt;
}

/** Armo recomendaciones tipo price es decir que se quedan fijas y ajusto según gravedad/tipo. */
function recomendacionesPorTipoYDolor(tipoFinal, gravedad) {
  const PRICE = [
    'Proteger e inmovilizar la zona lesionada.',
    'Reposo relativo: evita movimientos/impactos dolorosos.',
    'Hielo 15–20 min cada 2–3 h por 48 h (envolver, no directo).',
    'Compresión ligera con venda elástica.',
    'Elevación para disminuir inflamación.'
  ];

  const porTipo = {
    'Esguince': [...PRICE, 'No calor/masajes 48–72 h.', 'Movilidad suave 48–72 h si cede dolor.', 'Fisioterapia: fuerza y propiocepción.'],
    'Desgarre': [...PRICE, 'Evita estirar fuerte 3–5 días.', 'Progresión de fuerza guiada.'],
    'Fractura': ['Inmoviliza. No intentes recolocar.', 'Frío envuelto. No apoyar.', 'Acude a urgencias de inmediato.'],
    'Luxación': ['Inmoviliza tal cual.', 'No recolocar.', 'Acude a urgencias de inmediato.'],
    'Otra lesión': [...PRICE, 'Si no mejora en 48–72 h, solicitar valoración.']
  };

  // Si es alta y no es una urgencia “pura”, igual se destaca el buscar valoración.
  if (gravedad === 'Alta' && (tipoFinal === 'Esguince' || tipoFinal === 'Desgarre' || tipoFinal === 'Otra lesión')) {
    porTipo[tipoFinal].push('Dolor muy intenso o limitación fuerte → acudir a valoración médica.');
  }

  return porTipo[tipoFinal] || porTipo['Otra lesión'];
}

/** Si el modelo da "Otra" y la zona es muy típica, me quedo con la de zona. */
function decidirTipoFinal(tipoModelo, zonaNorm) {
  const sugerido = tipoSugeridoPorZona(zonaNorm);
  if (tipoModelo === 'Otra lesión' && sugerido) return sugerido;
  return tipoModelo || sugerido || 'Otra lesión';
}

/** Construyo el payload final que consume el frontend. */
function construirRespuesta({ tipoModelo, datos }) {
  const zonaNorm = normalizaZona(datos.dolor_zona);
  const tipoFinal = decidirTipoFinal(tipoModelo, zonaNorm);
  const gravedad = gravedadPorDolor(datos.dolor_nivel, datos.dolor_dias, tipoFinal);
  const especialista = debeAcudirEspecialista(tipoFinal, gravedad, datos.dolor_nivel, datos.dolor_dias, zonaNorm);
  const fecha = fechaAhora();

  return {
    fecha: fecha.local,
    fechaISO: fecha.iso,
    tipo_lesion: tipoFinal,
    nombre: `Lesión compatible con ${normStr(tipoFinal)}`,
    gravedad,              // Baja / Media / Alta (definida por dolor)
    especialista,          // necesario/urgente y motivo 
    descripcion: descripcionPorTipo(tipoFinal, zonaNorm, datos.dolor_nivel, datos.dolor_dias),
    recomendaciones: recomendacionesPorTipoYDolor(tipoFinal, gravedad),
    dolor: {               // eco que uso en UI o para auditoría
      nivel: Number(datos.dolor_nivel) || 0,
      dias: Number(datos.dolor_dias) || 0,
      zona: zonaNorm
    },
    aviso: 'Orientación informativa; no reemplaza una valoración médica.'
  };
}

router.post('/', (req, res) => {
  const datos = { ...req.body };

  // 1) Valido lo esencial: sin dolor_* no puedo priorizar gravedad.
  if (datos.dolor_nivel === undefined || datos.dolor_zona === undefined || datos.dolor_dias === undefined) {
    return res.status(400).json({ error: 'Campos requeridos: dolor_nivel, dolor_zona, dolor_dias' });
  }

  // 2) Normalizo/casteo lo principal de las entradas obligatorias.
  datos.dolor_nivel = Number(datos.dolor_nivel);
  datos.dolor_dias  = Number(datos.dolor_dias);
  datos.dolor_zona  = normStr(datos.dolor_zona);

  // 3) (Opcional) Casteo el resto si llegan; el pipeline de Python quitara faltantes.
  const nums = [
    'edad','peso','estatura_m','frecuencia_juego_semana','duracion_partido_min',
    'entrena','calienta','calentamiento_min','horas_sueno','hidratacion_ok',
    'lesiones_ultimo_anno','recuperacion_sem','posicion',
    // compatibilidad v1
    'frecuencia_entrenamiento','calentamiento','estiramiento','genero'
  ];
  nums.forEach(k => { if (datos[k] !== undefined) datos[k] = Number(datos[k]); });
  ['nivel','superficie','clima'].forEach(k => { if (datos[k] !== undefined) datos[k] = normStr(datos[k]); });

  // 4) Llamo a Python SOLO para sugerir el tipo (la gravedad YA la tengo por dolor).
  const scriptPath = path.resolve(__dirname, '../ml-inference-service/predict.py');
  const py = spawn('python3', [scriptPath, JSON.stringify(datos)], { cwd: path.resolve(__dirname, '..') });

  let out = '', err = '';

  // Para no quedarme colgado si Python se tarda, aplico un timeout defensivo.
  const killer = setTimeout(() => {
    console.error(' Timeout ejecutando Python');
    py.kill('SIGKILL');
    // Aunque falle el modelo, siempre regreso una recomendación basada en dolor.
    const payload = construirRespuesta({ tipoModelo: 'Otra lesión', datos });
    return res.status(200).json(payload);
  }, 15000);

  py.stdout.on('data', d => { out += d.toString(); });
  py.stderr.on('data', d => { err += d.toString(); console.error('🐍 stderr:', d.toString()); });

  // Cuando Python termina, construyo el payload final y se responde.
  py.on('close', code => {
    clearTimeout(killer);
    const tipoModelo = (!err && code === 0 && out) ? out.toString().trim() : 'Otra lesión';
    const payload = construirRespuesta({ tipoModelo, datos });
    return res.status(200).json(payload);
  });
});

module.exports = router;

