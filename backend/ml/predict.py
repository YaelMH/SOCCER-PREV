# -*- coding: utf-8 -*-
import sys, json, joblib
from pathlib import Path
import pandas as pd
import numpy as np

BASE = Path(__file__).resolve().parent
pipe = joblib.load(str(BASE / "modelo.pkl"))

def f(x, default=np.nan):
    try: return float(x)
    except: return default

datos = json.loads(sys.argv[1])

# normaliza strings
for k in ["nivel","superficie","clima"]:
    if k in datos: datos[k] = str(datos[k]).lower()

# derivados
peso = f(datos.get("peso"))
est  = f(datos.get("estatura_m"))
datos["imc"] = (peso / (est**2)) if est and est>0 else np.nan
datos["carga_total_min"] = f(datos.get("duracion_partido_min")) * f(datos.get("frecuencia_juego_semana"))

cols = [
  "edad","peso","estatura_m","imc",
  "frecuencia_juego_semana","duracion_partido_min","carga_total_min",
  "entrena","calienta","calentamiento_min",
  "horas_sueno","hidratacion_ok","lesiones_ultimo_anno","recuperacion_sem",
  "posicion","nivel","superficie","clima"
]

row = {c: datos.get(c, np.nan) for c in cols}
X = pd.DataFrame([row], columns=cols)

pred = int(pipe.predict(X)[0])
mapa = {0:"Esguince",1:"Desgarre",2:"Fractura",3:"Luxación",4:"Otra lesión"}
print(mapa[pred], flush=True)
