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
const fs = require('fs');

const router = express.Router();

/* ==========
 * ARCHIVOS LOCALES (historial + CSV para reentrenar)
 * ========== */

// Carpeta para datos locales del microservicio de recomendación
const dataDir = path.resolve(__dirname, '../data');
// JSON con historial de recomendaciones
const historialPath = path.join(dataDir, 'historial_recomendaciones.json');
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
      usuario_id: datos.usuario_id ?? null, // 👈 MUY IMPORTANTE
      fechaISO: payload.fechaISO,
      fecha: payload.fecha,
      tipo_lesion: payload.tipo_lesion,
      gravedad: payload.gravedad,
      descripcion: payload.descripcion,
      fuente: 'Condición diaria + modelo',
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

/* ==========
 * LÓGICA DE NEGOCIO ORIGINAL
 * ========== */

/** Normalizar: se quitan nulos, se recorta y paso a minúsculas. */
function normStr(v) {
  return (v ?? '').toString().trim().toLowerCase();
}

/** Devuelve fecha local para mostrar ya cuando tengamos el front y también ISO por si la guardo en BD. */
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

/* Zonas tipo
 * Esta parte NO sustituye al modelo; solo me ayuda a orientar si el modelo responde "Otra lesión".
 */

/** Mapeo entradas libres de zona a etiquetas controladas. */
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
  return z; // si no la reconoce, se deja tal cual se ingresó
}

/** Por zona (ya normalizada) sugiero un tipo genérico. */
function tipoSugeridoPorZona(zonaNorm) {
  const mapa = {
    tobillo: 'Esguince',
    rodilla: 'Esguince', // podría ser menisco/ligamento, lo dejo genérico
    isquiotibiales: 'Desgarre',
    cuadriceps: 'Desgarre',
    muslo: 'Desgarre',
    pantorrilla: 'Desgarre',
    ingle: 'Desgarre',
    hombro: 'Luxación', // típico si “se zafó” o hubo impacto
    mano_muñeca: 'Otra lesión', // contusión/tendinopatía (o fractura si trauma fuerte)
    pie: 'Otra lesión',
    cadera: 'Otra lesión',
    espalda: 'Otra lesión'
  };
  return mapa[zonaNorm] || 'Otra lesión';
}

/*
 * La GRAVEDAD la definimos principalmente con nivel/duración del dolor o si es una fuerte lesión que tenga urgencia médica.
 *   - nivel ≥ 8  o días ≥ 14  -> Alta
 *   - nivel 5–7 o días 7–13   -> Media
 *   - resto                   -> Baja
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

// NIVEL DE URGENCIA
function debeAcudirEspecialista(tipoFinal, gravedad, nivelDolor, diasDolor, zona) {
  // Urgencia inmediata si sospecho fractura o luxación.
  if (tipoFinal === 'Fractura' || tipoFinal === 'Luxación') {
    return {
      necesario: true,
      urgente: true,
      motivo: 'Sospecha de daño óseo/articular. Requiere valoración inmediata.'
    };
  }
  // Dolor muy intenso o gravedad alta → sugerir valoración (no urgente).
  if (gravedad === 'Alta' || Number(nivelDolor) >= 8) {
    return {
      necesario: true,
      urgente: false,
      motivo:
        'Dolor intenso o persistente. Recomendada valoración clínica/fisioterapia.'
    };
  }
  // Articulaciones clave con dolor que no cede en 10 días → sugerir valoración.
  const zonasCríticas = ['rodilla', 'hombro', 'tobillo'];
  if (zonasCríticas.includes(zona) && Number(diasDolor) >= 10) {
    return {
      necesario: true,
      urgente: false,
      motivo:
        'Dolor persistente en articulación clave. Sugerida valoración.'
    };
  }
  // Caso leve/reciente → autocuidado y vigilancia 48–72 h.
  return {
    necesario: false,
    urgente: false,
    motivo: 'Si no mejora en 48–72 h o empeora, buscar valoración.'
  };
}

/** Generamos un texto corto que combine tipo + zona + intensidad/tiempo. */
function descripcionPorTipo(tipoFinal, zona, nivel, dias) {
  const base = {
    Esguince: 'Lesión de ligamentos por torsión/inestabilidad articular.',
    Desgarre: 'Ruptura parcial de fibras musculares por sobrecarga o arranque.',
    Fractura: 'Rotura ósea (dolor intenso y posible incapacidad funcional).',
    Luxación: 'Pérdida de congruencia articular (se “zafa” la articulación).',
    'Otra lesión': 'Molestia inespecífica (contusión, tendinopatía u otra).'
  };
  const ztxt =
    zona !== 'desconocida'
      ? ` Reportas dolor en ${zona} (intensidad ${nivel}/10, ${dias} día(s)).`
      : ` Intensidad ${nivel}/10, ${dias} día(s).`;
  return (base[tipoFinal] || base['Otra lesión']) + ztxt;
}

/** Armo recomendaciones tipo PRICE y ajusto según gravedad/tipo. */
function recomendacionesPorTipoYDolor(tipoFinal, gravedad) {
  const PRICE = [
    'Proteger e inmovilizar la zona lesionada.',
    'Reposo relativo: evita movimientos/impactos dolorosos.',
    'Hielo 15–20 min cada 2–3 h por 48 h (envolver, no directo).',
    'Compresión ligera con venda elástica.',
    'Elevación para disminuir inflamación.'
  ];

  const porTipo = {
    Esguince: [
      ...PRICE,
      'No calor/masajes 48–72 h.',
      'Movilidad suave 48–72 h si cede dolor.',
      'Fisioterapia: fuerza y propiocepción.'
    ],
    Desgarre: [
      ...PRICE,
      'Evita estirar fuerte 3–5 días.',
      'Progresión de fuerza guiada.'
    ],
    Fractura: [
      'Inmoviliza. No intentes recolocar.',
      'Frío envuelto. No apoyar.',
      'Acude a urgencias de inmediato.'
    ],
    Luxación: [
      'Inmoviliza tal cual.',
      'No recolocar.',
      'Acude a urgencias de inmediato.'
    ],
    'Otra lesión': [...PRICE, 'Si no mejora en 48–72 h, solicitar valoración.']
  };

  // Si es alta y no es una urgencia “pura”, destaco el buscar valoración.
  if (
    gravedad === 'Alta' &&
    (tipoFinal === 'Esguince' ||
      tipoFinal === 'Desgarre' ||
      tipoFinal === 'Otra lesión')
  ) {
    porTipo[tipoFinal].push(
      'Dolor muy intenso o limitación fuerte → acudir a valoración médica.'
    );
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

  return {
    fecha: fecha.local,
    fechaISO: fecha.iso,
    tipo_lesion: tipoFinal,
    nombre: `Lesión compatible con ${normStr(tipoFinal)}`,
    gravedad, // Baja / Media / Alta (definida por dolor)
    especialista, // necesario/urgente y motivo
    descripcion: descripcionPorTipo(
      tipoFinal,
      zonaNorm,
      datos.dolor_nivel,
      datos.dolor_dias
    ),
    recomendaciones: recomendacionesPorTipoYDolor(tipoFinal, gravedad),
    dolor: {
      // eco que uso en UI o para auditoría
      nivel: Number(datos.dolor_nivel) || 0,
      dias: Number(datos.dolor_dias) || 0,
      zona: zonaNorm
    },
    aviso: 'Orientación informativa; no reemplaza una valoración médica.'
  };
}

/* ==========
 * POST /api/recomendacion  (genera recomendación + guarda historial)
 * ========== */

router.post('/', (req, res) => {
  const datos = { ...req.body };

  console.log('==== NUEVA PETICIÓN /api/recomendacion ====');
  console.log('/api/recomendacion body:', datos);

  // 1) Valido lo esencial: sin dolor_* no puedo priorizar gravedad.
  if (
    datos.dolor_nivel === undefined ||
    datos.dolor_zona === undefined ||
    datos.dolor_dias === undefined
  ) {
    return res.status(400).json({
      error: 'Campos requeridos: dolor_nivel, dolor_zona, dolor_dias'
    });
  }

  // 2) Normalizo/casteo lo principal de las entradas obligatorias.
  datos.dolor_nivel = Number(datos.dolor_nivel);
  datos.dolor_dias = Number(datos.dolor_dias);
  datos.dolor_zona = normStr(datos.dolor_zona);

  // 3) (Opcional) Casteo el resto si llegan; el pipeline de Python quitará faltantes.
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

  // Carpeta del microservicio de ML
  const mlDir = path.resolve(__dirname, '../../ml-inference-service');
  const scriptPath = path.resolve(mlDir, 'predict.py');

  console.log('mlDir      =>', mlDir);
  console.log('scriptPath =>', scriptPath);

  // Lanzamos python3 (del sistema). Si falla, caemos a fallback.
  const py = spawn('python3', [scriptPath, JSON.stringify(datos)], {
    cwd: mlDir
  });

  let out = '';
  let err = '';

  // Timeout DEFENSIVO (5 s)
  const killer = setTimeout(() => {
    console.error('*** Timeout ejecutando Python (5s) ***');

    if (!res.headersSent) {
      const payload = construirRespuesta({
        tipoModelo: 'Otra lesión',
        datos
      });

      // Guardar también cuando usamos fallback por timeout
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

      // Guardar también en caso de error al lanzar Python
      guardarRecomendacionLocal(datos, payload);

      console.log('→ Respondiendo por ERROR al lanzar Python con fallback JS');
      res.status(200).json(payload);
    }
  });

  py.on('close', (code) => {
    clearTimeout(killer);
    console.log('Python terminó con código:', code);

    if (res.headersSent) {
      console.log(
        'Respuesta ya enviada (timeout/error), no se envía de nuevo.'
      );
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

    // Guardar cuando todo sale bien con el modelo
    guardarRecomendacionLocal(datos, payload);

    console.log('→ Respondiendo con payload basado en modelo');
    return res.status(200).json(payload);
  });
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

    // Filtrar por usuario si lo mandan
    if (usuario_id) {
      historial = historial.filter(
        (item) => item.usuario_id === usuario_id
      );
    }

    // Ordenar por fecha más reciente primero
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