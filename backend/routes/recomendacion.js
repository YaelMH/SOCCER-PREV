// backend/routes/recomendacion.js
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

/* ───────────── Helpers de normalización ───────────── */
function normStr(v) { return (v ?? '').toString().trim().toLowerCase(); }
function fechaAhora() {
  const d = new Date();
  return { iso: d.toISOString(), local: d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) };
}

/* ───────────── Zonas → tipo sugerido (heurístico) ─────────────
   * No sustituye al modelo, pero orienta la recomendación si "otra lesión"
   * o cuando la zona es muy característica.
*/
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
  return z; // devolver lo que sea que venga
}

function tipoSugeridoPorZona(zonaNorm) {
  const mapa = {
    tobillo: 'Esguince',
    rodilla: 'Esguince',           // (podría ser ligamento/menisco; mantenemos genérico)
    isquiotibiales: 'Desgarre',
    cuadriceps: 'Desgarre',
    muslo: 'Desgarre',
    pantorrilla: 'Desgarre',
    ingle: 'Desgarre',
    hombro: 'Luxación',            // si hubo “zafón”/impacto
    mano_muñeca: 'Otra lesión',    // contusión/tendinopatía, fractura si trauma fuerte
    pie: 'Otra lesión',
    cadera: 'Otra lesión',
    espalda: 'Otra lesión'
  };
  return mapa[zonaNorm] || 'Otra lesión';
}

/* ───────────── Triage por dolor (PRINCIPAL) ─────────────
   * Define gravedad con base en nivel/días.
   * Muy doloroso (>=8) o dolor prolongado (>=14 días) → Alta
   * Moderado (5–7) o 7–13 días → Media
   * Leve/reciente → Baja
*/
function gravedadPorDolor(nivel, dias, tipoFinal) {
  const n = Number(nivel) || 0;
  const d = Number(dias) || 0;

  // Sospecha de urgencia si tipo final es fractura/luxación
  if (tipoFinal === 'Fractura' || tipoFinal === 'Luxación') return 'Alta';

  if (n >= 8 || d >= 14) return 'Alta';
  if (n >= 5 || d >= 7) return 'Media';
  return 'Baja';
}

/* ir/urgencia según dolor y tipo */
function debeAcudirEspecialista(tipoFinal, gravedad, nivelDolor, diasDolor, zona) {
  if (tipoFinal === 'Fractura' || tipoFinal === 'Luxación') {
    return { necesario: true, urgente: true, motivo: 'Sospecha de daño óseo/articular. Requiere valoración inmediata.' };
  }
  if (gravedad === 'Alta' || Number(nivelDolor) >= 8) {
    return { necesario: true, urgente: false, motivo: 'Dolor intenso o persistente. Recomendada valoración clínica/fisioterapia.' };
  }
  // zonas con alerta si persiste > 7–10 días
  const zonasCríticas = ['rodilla', 'hombro', 'tobillo'];
  if (zonasCríticas.includes(zona) && Number(diasDolor) >= 10) {
    return { necesario: true, urgente: false, motivo: 'Dolor persistente en articulación clave. Sugerida valoración.' };
  }
  return { necesario: false, urgente: false, motivo: 'Si no mejora en 48–72 h o empeora, buscar valoración.' };
}

/* Descripción personalizada */
function descripcionPorTipo(tipoFinal, zona, nivel, dias) {
  const base = {
    'Esguince': 'Lesión de ligamentos por torsión/inestabilidad articular.',
    'Desgarre': 'Ruptura parcial de fibras musculares por sobrecarga o arranque.',
    'Fractura': 'Rotura ósea (dolor intenso y posible incapacidad funcional).',
    'Luxación': 'Pérdida de congruencia articular (se “zafa” la articulación).',
    'Otra lesión': 'Molestia inespecífica (contusión, tendinopatía u otra).'
  };
  const ztxt = zona !== 'desconocida' ? ` Reportas dolor en ${zona} (intensidad ${nivel}/10, ${dias} día(s)).` : ` Intensidad ${nivel}/10, ${dias} día(s).`;
  return (base[tipoFinal] || base['Otra lesión']) + ztxt;
}

/* Recomendaciones base + ajustes por gravedad */
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

  if (gravedad === 'Alta' && (tipoFinal === 'Esguince' || tipoFinal === 'Desgarre' || tipoFinal === 'Otra lesión')) {
    porTipo[tipoFinal].push('Dolor muy intenso o limitación fuerte → acudir a valoración médica.');
  }

  return porTipo[tipoFinal] || porTipo['Otra lesión'];
}

/* Combina tipo del modelo con la zona: si el modelo devuelve "Otra" y la zona es muy típica, usamos la de zona */
function decidirTipoFinal(tipoModelo, zonaNorm) {
  const sugerido = tipoSugeridoPorZona(zonaNorm);
  if (tipoModelo === 'Otra lesión' && sugerido) return sugerido;
  return tipoModelo || sugerido || 'Otra lesión';
}

/* Construye respuesta rica, basándose PRINCIPALMENTE en el dolor */
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
    gravedad,              // Baja / Media / Alta (principal: dolor)
    especialista,          // { necesario, urgente, motivo }
    descripcion: descripcionPorTipo(tipoFinal, zonaNorm, datos.dolor_nivel, datos.dolor_dias),
    recomendaciones: recomendacionesPorTipoYDolor(tipoFinal, gravedad),
    dolor: {               // eco útil para UI
      nivel: Number(datos.dolor_nivel) || 0,
      dias: Number(datos.dolor_dias) || 0,
      zona: zonaNorm
    },
    aviso: 'Orientación informativa; no reemplaza una valoración médica.'
  };
}

/* ───────────── Endpoint ─────────────
   Espera AHORA estos campos clave del usuario:
   - dolor_nivel (1–10)  | requerido
   - dolor_zona  (texto) | requerido
   - dolor_dias  (>=0)   | requerido
   (y puede recibir los anteriores del modelo: edad, posicion, etc. como complemento)
*/
router.post('/', (req, res) => {
  const datos = { ...req.body };

  // Validación principal (dolor)
  if (datos.dolor_nivel === undefined || datos.dolor_zona === undefined || datos.dolor_dias === undefined) {
    return res.status(400).json({ error: 'Campos requeridos: dolor_nivel, dolor_zona, dolor_dias' });
  }
  // Normalización mínima
  datos.dolor_nivel = Number(datos.dolor_nivel);
  datos.dolor_dias  = Number(datos.dolor_dias);
  datos.dolor_zona  = normStr(datos.dolor_zona);

  // (Opcional) Casteo de los anteriores si llegan (el pipeline imputa faltantes)
  const nums = [
    'edad','peso','estatura_m','frecuencia_juego_semana','duracion_partido_min',
    'entrena','calienta','calentamiento_min','horas_sueno','hidratacion_ok',
    'lesiones_ultimo_anno','recuperacion_sem','posicion',
    // compatibilidad v1
    'frecuencia_entrenamiento','calentamiento','estiramiento','genero'
  ];
  nums.forEach(k => { if (datos[k] !== undefined) datos[k] = Number(datos[k]); });
  ['nivel','superficie','clima'].forEach(k => { if (datos[k] !== undefined) datos[k] = normStr(datos[k]); });

  // Ejecutar Python (modelo) SOLO para sugerir tipo (no define gravedad)
  const scriptPath = path.resolve(__dirname, '../ml/predict.py');
  const py = spawn('python3', [scriptPath, JSON.stringify(datos)], { cwd: path.resolve(__dirname, '..') });

  let out = '', err = '';
  const killer = setTimeout(() => {
    console.error('⏱️  Timeout ejecutando Python');
    py.kill('SIGKILL');
    // Aún sin modelo, devolvemos recomendación basada en dolor
    const payload = construirRespuesta({ tipoModelo: 'Otra lesión', datos });
    return res.status(200).json(payload);
  }, 15000);

  py.stdout.on('data', d => { out += d.toString(); });
  py.stderr.on('data', d => { err += d.toString(); console.error('🐍 stderr:', d.toString()); });

  py.on('close', code => {
    clearTimeout(killer);
    const tipoModelo = (!err && code === 0 && out) ? out.toString().trim() : 'Otra lesión';
    const payload = construirRespuesta({ tipoModelo, datos });
    return res.status(200).json(payload);
  });
});

module.exports = router;
