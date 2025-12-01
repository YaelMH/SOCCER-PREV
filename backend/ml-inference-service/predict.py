"""
Script de inferencia del modelo de lesión.

Se invoca desde Node con algo como:
    spawn('python3', ['predict.py', JSON_STRING])

- Carga un Pipeline entrenado (preprocesamiento + RandomForest)
  guardado en "modelo.pkl".
- Recibe un JSON con los datos del jugador / condición diaria.
- Devuelve por stdout SOLO una cadena con el tipo de lesión sugerido:
    "Esguince", "Desgarre", "Fractura", "Luxación" u "Otra lesión".

La gravedad, texto explicativo y recomendaciones se calculan
en recomendacion.js usando reglas clínicas y los síntomas reportados.
"""

import sys
import json
import joblib
from pathlib import Path

import pandas as pd
import numpy as np

# ==========================
#  CARGA DEL MODELO
# ==========================

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "modelo.pkl"

try:
    pipe = joblib.load(str(MODEL_PATH))
except Exception as e:
    # Si no podemos cargar el modelo, siempre responderemos "Otra lesión"
    # (la ruta de Node hará el resto con reglas de negocio).
    print("Otra lesión", flush=True)
    sys.exit(0)


# ==========================
#  HELPERS
# ==========================

def f(x, default=np.nan):
    """
    Intenta convertir x a float.
    Si no se puede (None, '', texto), devuelve default (NaN).
    """
    try:
        return float(x)
    except Exception:
        return default


def norm_str(x: str) -> str:
    """
    Normaliza cadenas: string -> minúsculas y sin espacios extremos.
    (Evita que OneHotEncoder trate variantes como categorías distintas).
    """
    if x is None:
        return ""
    return str(x).strip().lower()


# ==========================
#  LECTURA DEL JSON
# ==========================

if len(sys.argv) < 2:
    # Si por alguna razón no llega JSON, devolvemos algo genérico
    print("Otra lesión", flush=True)
    sys.exit(0)

try:
    datos = json.loads(sys.argv[1])
except Exception:
    # Si el JSON viene malformado, devolvemos algo genérico
    print("Otra lesión", flush=True)
    sys.exit(0)

# ==========================
#  NORMALIZACIÓN BÁSICA
# ==========================

# Normalizamos cadenas que el modelo trata como categóricas
for k in ["nivel", "superficie", "clima", "posicion"]:
    if k in datos and datos[k] is not None:
        datos[k] = norm_str(datos[k])

# Variables derivadas que el modelo espera:
#   - imc = peso / estatura^2
#   - carga_total_min = duración partido * frecuencia semanal
peso = f(datos.get("peso"))
est = f(datos.get("estatura_m"))

if est is not np.nan and est is not None and est > 0:
    datos["imc"] = peso / (est ** 2)
else:
    datos["imc"] = np.nan

duracion = f(datos.get("duracion_partido_min"))
freq = f(datos.get("frecuencia_juego_semana"))

if np.isnan(duracion) or np.isnan(freq):
    datos["carga_total_min"] = np.nan
else:
    datos["carga_total_min"] = duracion * freq

# ==========================
#  COLUMNAS ESPERADAS
# ==========================

# Debe corresponder EXACTAMENTE a lo que usaste al entrenar el Pipeline.
cols = [
    "edad",
    "peso",
    "estatura_m",
    "imc",
    "frecuencia_juego_semana",
    "duracion_partido_min",
    "carga_total_min",
    "entrena",
    "calienta",
    "calentamiento_min",
    "horas_sueno",
    "hidratacion_ok",
    "lesiones_ultimo_anno",
    "recuperacion_sem",
    "posicion",
    "nivel",
    "superficie",
    "clima",
]

# Construimos una sola fila con esos campos, usando NaN si falta alguno.
row = {c: datos.get(c, np.nan) for c in cols}
X = pd.DataFrame([row], columns=cols)

# ==========================
#  PREDICCIÓN
# ==========================

try:
    pred_int = int(pipe.predict(X)[0])
except Exception:
    # Si el modelo revienta por cualquier motivo, devolvemos algo genérico.
    print("Otra lesión", flush=True)
    sys.exit(0)

# Mapa de clases numéricas a etiqueta legible
mapa = {
    0: "Esguince",
    1: "Desgarre",
    2: "Fractura",
    3: "Luxación",
    4: "Otra lesión",
}

tipo = mapa.get(pred_int, "Otra lesión")

# Node lee exactamente esta línea desde stdout
print(tipo, flush=True)