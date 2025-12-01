/*
 * En este endpoint se construye la recomendación final para el usuario.
 * La decisión principal de GRAVEDAD la estamos basando en la sensación del usuario:
 *   - dolor_nivel (1–10)
 *   - dolor_zona  (texto libre y lo normalizamos a zonas típicas)
 *   - dolor_dias  (duración en días)
 *
 * El modelo de ML sugiere un tipo de lesión, pero aquí aplicamos reglas
 * clínicas básicas para evitar que todo salga como "Fractura".
 * Esto es ORIENTATIVO y NO sustituye una valoración médica profesional.
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

/* ==========
 * ARCHIVOS LOCALES (historial + feedback + CSV para reentrenar)
 * ========== */

// Carpeta para datos locales del microservicio de recomendación
const dataDir = path.resolve(__dirname, '../data');
// JSON con historial de recomendaciones
const historialPath = path.join(dataDir, 'historial_recomendaciones.json');
// JSON con feedback de recomendaciones
const feedbackPath = path.join(dataDir, 'feedback_recomendaciones.json');
// CSV con nuevos casos para reentrenar el modelo
const nuevosCsvPath = path.resolve(
  __dirname,
  '../../ml-inference-service/dataset_soccerprev_nuevos.csv'
);

function asegurarArchivosLocales() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(historialPath)) {
      fs.writeFileSync(historialPath, '[]', 'utf8');
    }

    if (!fs.existsSync(feedbackPath)) {
      fs.writeFileSync(feedbackPath, '[]', 'utf8');
    }

    if (!fs.existsSync(nuevosCsvPath)) {
      // IMPORTANTE: ajusta los nombres de columnas si en train_model.py usas otros
      const encabezados = [
        'edad',
        'peso',
        'estatura_m',
        'posicion',
        'nivel',
        'frecuencia_juego_semana',
        'duracion_partido_min',
        'superficie',
        'clima',
        'entrena',
        'calienta',
        'calentamiento_min',
        'horas_sueno',
        'hidratacion_ok',
        'lesiones_ultimo_anno',
        'recuperacion_sem',
        'dolor_nivel',
        'dolor_dias',
        'dolor_zona',
        'tipo_lesion'
      ].join(',');
      fs.writeFileSync(nuevosCsvPath, encabezados + '\n', 'utf8');
    }
  } catch (err) {
    console.error('Error creando archivos locales de datos:', err);
  }
}

asegurarArchivosLocales();

/** Guarda la recomendación en JSON (historial) y CSV (reentrenamiento). */
function guardarRecomendacionLocal(datos, payload) {
  // 1) Historial JSON
  try {
    const contenido = fs.readFileSync(historialPath, 'utf8');
    const historial = JSON.parse(contenido);

    historial.push({
      id: Date.now(),
      usuario_id: datos.usuario_id ?? null,
      fechaISO: payload.fechaISO,
      fecha: payload.fecha,
      tipo_lesion: payload.tipo_lesion,
      gravedad: payload.gravedad,
      descripcion: payload.descripcion,
      fuente: 'Condición diaria + modelo',
      recomendaciones: payload.recomendaciones ?? [],
      especialista: payload.especialista ?? null, // para el modal / detalle
      dolor: payload.dolor ?? null,               // para el modal / detalle
      estado_fisico: payload.estado_fisico ?? null, // 👈 NUEVO: guardamos estado físico
      aviso: payload.aviso ?? '',
      entrada: datos
    });

    fs.writeFileSync(historialPath, JSON.stringify(historial, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando historial_recomendaciones:', err);
  }

  // 2) CSV de nuevos casos (sin usuario_id para no romper tu training actual)
  try {
    const fila = [
      datos.edad ?? '',
      datos.peso ?? '',
      datos.estatura_m ?? '',
      datos.posicion ?? '',
      datos.nivel ?? '',
      datos.frecuencia_juego_semana ?? '',
      datos.duracion_partido_min ?? '',
      datos.superficie ?? '',
      datos.clima ?? '',
      datos.entrena ?? '',
      datos.calienta ?? '',
      datos.calentamiento_min ?? '',
      datos.horas_sueno ?? '',
      datos.hidratacion_ok ?? '',
      datos.lesiones_ultimo_anno ?? '',
      datos.recuperacion_sem ?? '',
      datos.dolor_nivel ?? '',
      datos.dolor_dias ?? '',
      datos.dolor_zona ?? '',
      payload.tipo_lesion ?? ''
    ]
      .map((v) => (v === undefined || v === null ? '' : v))
      .join(',');

    fs.appendFileSync(nuevosCsvPath, '\n' + fila);
  } catch (err) {
    console.error('Error guardando dataset_soccerprev_nuevos.csv:', err);
  }
}

/** Guarda feedback de una recomendación en JSON plano. */
function guardarFeedbackLocal(payload) {
  try {
    if (!fs.existsSync(feedbackPath)) {
      fs.writeFileSync(feedbackPath, '[]', 'utf8');
    }

    const contenido = fs.readFileSync(feedbackPath, 'utf8');
    const lista = JSON.parse(contenido);

    const ahora = new Date();
    const item = {
      id: Date.now(),
      fechaISO: ahora.toISOString(),
      fecha: ahora.toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short'
      }),
      ...payload
    };

    lista.push(item);
    fs.writeFileSync(feedbackPath, JSON.stringify(lista, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando feedback_recomendaciones:', err);
  }
}

/* ==========
 * LÓGICA DE NEGOCIO
 * ========== */

/** Normalizar: se quitan nulos, se recorta y paso a minúsculas. */
function normStr(v) {
  return (v ?? '').toString().trim().toLowerCase();
}

/** Devuelve fecha local + ISO. */
function fechaAhora() {
  const d = new Date();
  return {
    iso: d.toISOString(),
    local: d.toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  };
}

/* Zonas tipo:
 * No sustituyen al modelo; solo ayudan cuando el modelo es muy genérico
 * o cuando corregimos falsos positivos de "Fractura".
 */
function normalizaZona(z) {
  z = normStr(z);
  if (!z) return 'desconocida';
  if (z.includes('tobillo')) return 'tobillo';
  if (z.includes('rodilla')) return 'rodilla';
  if (z.includes('isqu') || z.includes('isqui')) return 'isquiotibiales';
  if (z.includes('muslo') && (z.includes('ant') || z.includes('cuad')))
    return 'cuadriceps';
  if (z.includes('muslo')) return 'muslo';
  if (z.includes('pantorr') || z.includes('gemelo')) return 'pantorrilla';
  if (z.includes('ingle') || z.includes('aductor')) return 'ingle';
  if (z.includes('cadera')) return 'cadera';
  if (z.includes('espalda') || z.includes('lumba')) return 'espalda';
  if (z.includes('hombro')) return 'hombro';
  if (z.includes('muñec') || z.includes('man') || z.includes('dedo'))
    return 'mano_muñeca';
  if (z.includes('pie')) return 'pie';
  return z;
}

function tipoSugeridoPorZona(zonaNorm) {
  const mapa = {
    tobillo: 'Esguince',
    rodilla: 'Esguince',
    isquiotibiales: 'Desgarre',
    cuadriceps: 'Desgarre',
    muslo: 'Desgarre',
    pantorrilla: 'Desgarre',
    ingle: 'Desgarre',
    hombro: 'Luxación',
    mano_muñeca: 'Otra lesión',
    pie: 'Otra lesión',
    cadera: 'Otra lesión',
    espalda: 'Otra lesión'
  };
  return mapa[zonaNorm] || 'Otra lesión';
}

/*
 * GRAVEDAD basada en dolor y duración.
 * Tomamos como referencia que dolor muy intenso (≥8/10)
 * o dolor que lleva ≥21 días sin mejorar se trata como "Alta" por seguridad.
 */
function gravedadPorDolor(nivel, dias, tipoFinal) {
  const n = Number(nivel) || 0;
  const d = Number(dias) || 0;

  // Si el tipo implica urgencia por definición, priorizo Alta.
  if (tipoFinal === 'Fractura' || tipoFinal === 'Luxación') return 'Alta';

  if (n >= 8 || d >= 21) return 'Alta';
  if (n >= 5 || d >= 7) return 'Media';
  return 'Baja';
}

/*
 * Reglas de corrección clínica para el tipo de lesión:
 * - Si el modelo dice "Fractura" pero el dolor es bajo y reciente,
 *   bajamos a Esguince/Desgarre/Otra lesión.
 * - Si dice "Luxación" pero el dolor es bajo, la tratamos como algo menos grave.
 * - Si el modelo es muy genérico ("Otra lesión"), usamos la zona.
 */
function decidirTipoFinalSegunClinica(tipoModelo, zonaNorm, nivelDolor, diasDolor) {
  const n = Number(nivelDolor) || 0;
  const d = Number(diasDolor) || 0;
  const sugeridoZona = tipoSugeridoPorZona(zonaNorm);

  // 1) Si el modelo está vacío o es muy genérico
  if (!tipoModelo || tipoModelo === 'Otra lesión') {
    return sugeridoZona || 'Otra lesión';
  }

  // 2) Ajuste específico para "Fractura"
  if (tipoModelo === 'Fractura') {
    // Sospecha fuerte de fractura:
    // - Dolor muy intenso (≥8)
    // - O dolor intenso (≥7) y pocos días (≤3)
    // - O dolor moderado/alto (≥6) que lleva ≥10 días
    const sospechaFuerte =
      n >= 8 ||
      (n >= 7 && d <= 3) ||
      (n >= 6 && d >= 10);

    if (!sospechaFuerte) {
      if (sugeridoZona && sugeridoZona !== 'Otra lesión') {
        return sugeridoZona;
      }
      return 'Otra lesión';
    }
  }

  // 3) Ajuste para "Luxación": suele ser muy dolorosa.
  if (tipoModelo === 'Luxación' && n <= 5) {
    if (sugeridoZona && sugeridoZona !== 'Otra lesión') {
      return sugeridoZona;
    }
    return 'Otra lesión';
  }

  // 4) Esguince/Desgarre normalmente se respetan.
  return tipoModelo;
}

// NIVEL DE URGENCIA / ESPECIALISTA
function debeAcudirEspecialista(tipoFinal, gravedad, nivelDolor, diasDolor, zona) {
  const n = Number(nivelDolor) || 0;
  const d = Number(diasDolor) || 0;

  // Siempre urgencia si fractura/luxación
  if (tipoFinal === 'Fractura' || tipoFinal === 'Luxación') {
    return {
      necesario: true,
      urgente: true,
      motivo:
        'Sospecha de daño óseo/articular importante. Es recomendable acudir a urgencias o valoración médica inmediata, sobre todo si hay deformidad, imposibilidad para apoyar o hinchazón marcada.'
    };
  }

  // Dolor muy intenso o gravedad alta → valoración prioritaria
  if (gravedad === 'Alta' || n >= 8) {
    return {
      necesario: true,
      urgente: false,
      motivo:
        'Dolor muy intenso o persistente. Se recomienda valoración médica o fisioterapia en los próximos días.'
    };
  }

  // Articulaciones clave con dolor que no cede en ≥10 días
  const zonasCríticas = ['rodilla', 'hombro', 'tobillo'];
  if (zonasCríticas.includes(zona) && d >= 10) {
    return {
      necesario: true,
      urgente: false,
      motivo:
        'Dolor persistente en una articulación importante. Es recomendable una valoración para descartar lesiones estructurales.'
    };
  }

  // Caso leve/reciente → autocuidado con vigilancia
  return {
    necesario: false,
    urgente: false,
    motivo:
      'Por ahora parecen medidas de autocuidado (reposo relativo, hielo, compresión y elevación). Si el dolor empeora, aparece deformidad o no puedes apoyar, acude a valoración.'
  };
}

/** Descripción corta combinando tipo + zona + intensidad/tiempo. */
function descripcionPorTipo(tipoFinal, zona, nivel, dias) {
  const base = {
    Esguince:
      'Lesión de ligamentos por torsión/inestabilidad articular, frecuente en tobillo y rodilla.',
    Desgarre:
      'Lesión de fibras musculares (desde sobrecarga leve hasta ruptura parcial) típica en muslo, pantorrilla o ingle.',
    Fractura:
      'Posible rotura ósea. Suele acompañarse de dolor muy intenso, dificultad para apoyar y, a veces, deformidad visible.',
    Luxación:
      'Pérdida de congruencia de la articulación (se “zafa”), habitualmente muy dolorosa y con limitación importante del movimiento.',
    'Otra lesión':
      'Molestia inespecífica (contusión, sobrecarga, tendinopatía u otra alteración de tejidos blandos).'
  };
  const ztxt =
    zona !== 'desconocida'
      ? ` Reportas dolor en ${zona} (intensidad ${nivel}/10, ${dias} día(s)).`
      : ` Intensidad ${nivel}/10, ${dias} día(s).`;

  return (base[tipoFinal] || base['Otra lesión']) + ztxt;
}

/** Recomendaciones tipo PRICE/POLICE ajustadas por tipo y gravedad. */
function recomendacionesPorTipoYDolor(tipoFinal, gravedad) {
  const PRICE = [
    'Proteger la zona lesionada: evita impactos y gestos que aumenten el dolor.',
    'Reposo relativo: mantente activo, pero sin forzar la zona dolorida.',
    'Hielo 15–20 minutos cada 2–3 horas durante las primeras 48 horas (siempre envuelto, no directo sobre la piel).',
    'Compresión ligera con venda elástica si es posible, sin cortar la circulación.',
    'Elevación del segmento afectado para ayudar a disminuir la inflamación.'
  ];

  const porTipo = {
    Esguince: [
      ...PRICE,
      'Evita calor local y masajes intensos durante las primeras 48–72 horas.',
      'Introduce movilidad suave y progresiva cuando el dolor lo permita.',
      'Valora entrenamiento de fuerza y propiocepción para prevenir recaídas.'
    ],
    Desgarre: [
      ...PRICE,
      'Evita estiramientos fuertes sobre el músculo lesionado en los primeros 3–5 días.',
      'Reincorpora la carga de forma progresiva (caminar, trote suave, sprints) según tolere el dolor.',
      'Considera fisioterapia guiada si el dolor limita tus entrenamientos.'
    ],
    Fractura: [
      'Inmoviliza la zona en la posición más cómoda posible.',
      'No intentes recolocar la articulación ni “acomodar” el hueso.',
      'Aplica frío envuelto si hay inflamación, evitando presionar directamente sobre posible deformidad.',
      'No apoyes peso si hay sospecha en miembros inferiores.',
      'Acude a urgencias o valoración médica inmediata.'
    ],
    Luxación: [
      'Inmoviliza la articulación tal y como quedó tras la lesión.',
      'No intentes recolocarla por tu cuenta.',
      'Aplica frío envuelto alrededor de la articulación.',
      'Acude a urgencias de inmediato para reducción y valoración de tejidos asociados.'
    ],
    'Otra lesión': [
      ...PRICE,
      'Si el dolor o la inflamación no mejoran en 48–72 horas, o te limitan para entrenar, busca valoración médica o fisioterapia.'
    ]
  };

  // Si es alta y no es fractura/luxación, enfatizamos la valoración.
  if (
    gravedad === 'Alta' &&
    (tipoFinal === 'Esguince' ||
      tipoFinal === 'Desgarre' ||
      tipoFinal === 'Otra lesión')
  ) {
    porTipo[tipoFinal].push(
      'El nivel de dolor o la duración sugieren una lesión relevante. Es recomendable una valoración médica para descartar daños estructurales.'
    );
  }

  return porTipo[tipoFinal] || porTipo['Otra lesión'];
}

/** Calcula un índice simple de carga semanal (0–100) y recomendación breve. */
function calcularEstadoFisico(datos) {
  const freq = Number(datos.frecuencia_juego_semana) || 0;   // sesiones/semana
  const dur = Number(datos.duracion_partido_min) || 0;       // minutos por sesión
  const extraEntrena = Number(datos.entrena) || 0;           // 0/1 si entrena extra
  const horasSueno = Number(datos.horas_sueno) || 0;
  const hidratacionOk =
    datos.hidratacion_ok !== undefined ? Number(datos.hidratacion_ok) : NaN;
  const lesionesUlt = Number(datos.lesiones_ultimo_anno) || 0;

  // Carga base en minutos/semana
  let cargaMin = freq * dur + extraEntrena * 30; // bonus de 30 min por entrenamiento adicional

  // Escalamos a 0–100 tomando como referencia ~480 min (8 h/semana)
  const cargaRefMin = 480;
  let indice = (cargaMin / cargaRefMin) * 100;

  if (!Number.isFinite(indice)) indice = 0;

  // Ajustes por recuperación
  if (horasSueno >= 7) {
    indice += 5;
  } else if (horasSueno > 0 && horasSueno < 6) {
    indice -= 10;
  }

  if (!Number.isNaN(hidratacionOk)) {
    if (hidratacionOk === 1) indice += 3;
    if (hidratacionOk === 0) indice -= 5;
  }

  if (lesionesUlt >= 2) indice -= 5;

  // Clamp 0–100
  if (indice > 100) indice = 100;
  if (indice < 0) indice = 0;

  let categoria;
  let recomendacion;

  if (indice < 50) {
    categoria = 'baja';
    recomendacion =
      'Tu carga semanal parece baja o tu recuperación no es óptima. Aumenta volumen e intensidad de forma progresiva y cuida sueño y calentamiento.';
  } else if (indice < 75) {
    categoria = 'moderada';
    recomendacion =
      'Tu carga semanal es moderada. Mantén la progresión gradual, respeta los días de descanso y escucha signos tempranos de fatiga.';
  } else {
    categoria = 'alta';
    recomendacion =
      'Tu carga semanal es alta. Vigila molestias persistentes, ajusta intensidad si notas sobrecarga y refuerza recuperación (sueño, hidratación, estiramientos).';
  }

  return {
    indice: Math.round(indice),
    categoria,      // 'baja' | 'moderada' | 'alta'
    recomendacion
  };
}

/** Construyo el payload final que consume el frontend. */
function construirRespuesta({ tipoModelo, datos }) {
  const zonaNorm = normalizaZona(datos.dolor_zona);
  const tipoFinal = decidirTipoFinalSegunClinica(
    tipoModelo,
    zonaNorm,
    datos.dolor_nivel,
    datos.dolor_dias
  );
  const gravedad = gravedadPorDolor(
    datos.dolor_nivel,
    datos.dolor_dias,
    tipoFinal
  );
  const especialista = debeAcudirEspecialista(
    tipoFinal,
    gravedad,
    datos.dolor_nivel,
    datos.dolor_dias,
    zonaNorm
  );
  const fecha = fechaAhora();

  // 👇 NUEVO: cálculo de estado físico / carga semanal
  const estadoFisico = calcularEstadoFisico(datos);

  return {
    fecha: fecha.local,
    fechaISO: fecha.iso,
    tipo_lesion: tipoFinal,
    nombre: `Lesión compatible con ${normStr(tipoFinal)}`,
    gravedad, // Baja / Media / Alta
    especialista,
    descripcion: descripcionPorTipo(
      tipoFinal,
      zonaNorm,
      datos.dolor_nivel,
      datos.dolor_dias
    ),
    recomendaciones: recomendacionesPorTipoYDolor(tipoFinal, gravedad),
    dolor: {
      nivel: Number(datos.dolor_nivel) || 0,
      dias: Number(datos.dolor_dias) || 0,
      zona: zonaNorm
    },
    estado_fisico: estadoFisico, // 👈 NUEVO: se manda al frontend
    aviso:
      'Orientación informativa basada en síntomas reportados. No sustituye una valoración médica ni un diagnóstico profesional.'
  };
}

/* ==========
 * POST /api/recomendacion  (genera recomendación)
 * ========== */

router.post('/', (req, res) => {
  const datos = { ...req.body };

  console.log('==== NUEVA PETICIÓN /api/recomendacion ====');
  console.log('/api/recomendacion body:', datos);

  if (
    datos.dolor_nivel === undefined ||
    datos.dolor_zona === undefined ||
    datos.dolor_dias === undefined
  ) {
    return res.status(400).json({
      error: 'Campos requeridos: dolor_nivel, dolor_zona, dolor_dias'
    });
  }

  datos.dolor_nivel = Number(datos.dolor_nivel);
  datos.dolor_dias = Number(datos.dolor_dias);
  datos.dolor_zona = normStr(datos.dolor_zona);

  const nums = [
    'edad',
    'peso',
    'estatura_m',
    'frecuencia_juego_semana',
    'duracion_partido_min',
    'entrena',
    'calienta',
    'calentamiento_min',
    'horas_sueno',
    'hidratacion_ok',
    'lesiones_ultimo_anno',
    'recuperacion_sem',
    // compatibilidad v1
    'frecuencia_entrenamiento',
    'calentamiento',
    'estiramiento',
    'genero'
  ];
  nums.forEach((k) => {
    if (datos[k] !== undefined) datos[k] = Number(datos[k]);
  });
  ['nivel', 'superficie', 'clima', 'posicion'].forEach((k) => {
    if (datos[k] !== undefined) datos[k] = normStr(datos[k]);
  });

  const mlDir = path.resolve(__dirname, '../../ml-inference-service');
  const scriptPath = path.resolve(mlDir, 'predict.py');

  console.log('mlDir      =>', mlDir);
  console.log('scriptPath =>', scriptPath);

  const py = spawn('python3', [scriptPath, JSON.stringify(datos)], {
    cwd: mlDir
  });

  let out = '';
  let err = '';

  const killer = setTimeout(() => {
    console.error('*** Timeout ejecutando Python (5s) ***');

    if (!res.headersSent) {
      const payload = construirRespuesta({
        tipoModelo: 'Otra lesión',
        datos
      });

      guardarRecomendacionLocal(datos, payload);

      console.log('→ Respondiendo por TIMEOUT con fallback JS');
      res.status(200).json(payload);
    }

    py.kill('SIGKILL');
  }, 5000);

  py.stdout.on('data', (d) => {
    out += d.toString();
  });

  py.stderr.on('data', (d) => {
    err += d.toString();
    console.error('🐍 stderr:', d.toString());
  });

  py.on('error', (error) => {
    clearTimeout(killer);
    console.error('*** Error al lanzar Python ***', error);

    if (!res.headersSent) {
      const payload = construirRespuesta({
        tipoModelo: 'Otra lesión',
        datos
      });

      guardarRecomendacionLocal(datos, payload);

      console.log('→ Respondiendo por ERROR al lanzar Python con fallback JS');
      res.status(200).json(payload);
    }
  });

  py.on('close', (code) => {
    clearTimeout(killer);
    console.log('Python terminó con código:', code);

    if (res.headersSent) {
      console.log('Respuesta ya enviada (timeout/error), no se envía de nuevo.');
      return;
    }

    if (code !== 0) {
      console.error('Python salió con código', code);
      if (err) console.error('stderr completo:\n', err);
    }

    const salida = (out || '').toString().trim();
    const tipoModelo = code === 0 && salida ? salida : 'Otra lesión';

    console.log('tipoModelo recibido desde Python =>', tipoModelo);

    const payload = construirRespuesta({ tipoModelo, datos });

    guardarRecomendacionLocal(datos, payload);

    console.log('→ Respondiendo con payload basado en modelo');
    return res.status(200).json(payload);
  });
});

/* ==========
 * POST /api/recomendacion/feedback
 *  - Guarda evaluación de una recomendación
 * ========== */

router.post('/feedback', (req, res) => {
  const body = req.body || {};
  console.log('==== NUEVO FEEDBACK /api/recomendacion/feedback ====');
  console.log('payload:', body);

  const {
    usuario_id,
    recomendacion_id,
    aplicada,
    util_prevenir,
    claridad,
    estrellas,
    comentario
  } = body;

  if (
    !usuario_id ||
    recomendacion_id === undefined ||
    util_prevenir === undefined ||
    claridad === undefined ||
    estrellas === undefined
  ) {
    return res.status(400).json({
      error:
        'Campos requeridos: usuario_id, recomendacion_id, util_prevenir, claridad, estrellas'
    });
  }

  const feedbackItem = {
    usuario_id: String(usuario_id),
    recomendacion_id: Number(recomendacion_id),
    aplicada: Boolean(aplicada),
    util_prevenir: Number(util_prevenir),
    claridad: Number(claridad),
    estrellas: Number(estrellas),
    comentario: comentario ? String(comentario) : ''
  };

  guardarFeedbackLocal(feedbackItem);

  return res.status(201).json({ ok: true });
});

/* ==========
 * GET /api/recomendacion/historial
 *  - opcional: ?usuario_id=...&limit=10
 * ========== */

router.get('/historial', (req, res) => {
  try {
    const { usuario_id, limit } = req.query;
    const limitNum = parseInt(limit, 10) || 10;

    if (!fs.existsSync(historialPath)) {
      return res.json([]);
    }

    const contenido = fs.readFileSync(historialPath, 'utf8');
    let historial = JSON.parse(contenido);

    if (usuario_id) {
      historial = historial.filter((item) => item.usuario_id === usuario_id);
    }

    historial.sort((a, b) => {
      const fa = a.fechaISO || a.fecha || '';
      const fb = b.fechaISO || b.fecha || '';
      return fa < fb ? 1 : fa > fb ? -1 : 0;
    });

    const resultado = historial.slice(0, limitNum);
    return res.json(resultado);
  } catch (err) {
    console.error('Error leyendo historial:', err);
    return res.status(500).json({ error: 'No se pudo leer el historial' });
  }
});

module.exports = router;