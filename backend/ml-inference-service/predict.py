
"""
Este script lo invoco desde Node (con `spawn('python3', ['ml/predict.py', JSON])`)
para obtener  el tipo de lesión sugerido por el modelo entrenado.

- El modelo que cargo es un Pipeline (preprocesamiento + RandomForest) guardado en ml/modelo.pkl.
- Si algún campo no llega desde el backend, lo dejo como NaN y el propio Pipeline se encarga de imputarlo (gracias a SimpleImputer dentro del ColumnTransformer).
- Aquí no decido gravedad ni recomendaciones; eso lo hago en la ruta de Express con base en la sensación del usuario (dolor_nivel, dolor_dias, dolor_zona).
"""

import sys, json, joblib
from pathlib import Path
import pandas as pd
import numpy as np

# Localizo la carpeta ml/ sin depender del directorio desde el que se ejecuta Python.
BASE = Path(__file__).resolve().parent

# Cargo una sola vez el Pipeline (más rápido que re-entrenar o re-cargar en cada petición).
pipe = joblib.load(str(BASE / "modelo.pkl"))

def f(x, default=np.nan):
    """Intento castear a float; si falla (None, '' o texto), devuelvo default (NaN)."""
    try:
        return float(x)
    except:
        return default

# Leo el JSON que me pasó Node por argv[1]
# (ej: {"edad":22,"peso":72,"estatura_m":1.75,...})
datos = json.loads(sys.argv[1])

# Normalizo algunas variables categóricas a minúsculas para que OneHotEncoder no se vuelva loco con mayúsculas/acentos.
for k in ["nivel", "superficie", "clima"]:
    if k in datos:
        datos[k] = str(datos[k]).lower()

# Creo variables derivadas que el modelo espera:
#    - imc = peso / estatura^2 (si no tengo ambos, queda NaN)
#    - carga_total_min = duración por sesión * frecuencia semanal
peso = f(datos.get("peso"))
est  = f(datos.get("estatura_m"))
datos["imc"] = (peso / (est**2)) if est and est > 0 else np.nan
datos["carga_total_min"] = f(datos.get("duracion_partido_min")) * f(datos.get("frecuencia_juego_semana"))

# Defino el orden/lista de columnas EXACTO que el pipeline espera.
#    (Si falta alguna, pongo NaN; el preprocesador imputa).
cols = [
  "edad", "peso", "estatura_m", "imc",
  "frecuencia_juego_semana", "duracion_partido_min", "carga_total_min",
  "entrena", "calienta", "calentamiento_min",
  "horas_sueno", "hidratacion_ok", "lesiones_ultimo_anno", "recuperacion_sem",
  "posicion", "nivel", "superficie", "clima"
]

# Construyo un DataFrame de una sola fila, en el orden de columnas del modelo.
row = {c: datos.get(c, np.nan) for c in cols}
X = pd.DataFrame([row], columns=cols)

# Predigo la clase numérica y la mapeo a etiqueta legible.
pred = int(pipe.predict(X)[0])
mapa = {
    0: "Esguince",
    1: "Desgarre",
    2: "Fractura",
    3: "Luxación",
    4: "Otra lesión"
}

# Node lee esta salida por stdout.
print(mapa[pred], flush=True)
