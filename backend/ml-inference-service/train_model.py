"""
Entrenamiento del pipeline de ML (preprocesamiento + RandomForest)
para clasificar el tipo de lesión.

El modelo final se guarda en "modelo.pkl" en la misma carpeta que este script,
para que pueda ser cargado por predict.py.

Características usadas:

- Columnas numéricas:
  edad, peso, estatura_m, imc,
  frecuencia_juego_semana, duracion_partido_min, carga_total_min,
  entrena, calienta, calentamiento_min,
  horas_sueno, hidratacion_ok, lesiones_ultimo_anno, recuperacion_sem,
  posicion   (numérica 1..N según el dataset)

- Columnas categóricas:
  nivel, superficie, clima

- Objetivo:
  tipo_lesion en minúsculas:
    {"esguince", "desgarre", "fractura", "luxación", "otra"}

Adicional:
- Si existe "dataset_soccerprev_nuevos.csv" (alimentado por el backend),
  se concatena al dataset base para reentrenar con más ejemplos reales.
"""

import os
from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# ==========================
#  PATHS Y CARGA DE DATOS
# ==========================

BASE = Path(__file__).resolve().parent

DATASET_BASE_PATH = BASE / "dataset.csv"
DATASET_NUEVOS_PATH = BASE / "dataset_soccerprev_nuevos.csv"
MODEL_PATH = BASE / "modelo.pkl"

if not DATASET_BASE_PATH.exists():
  raise FileNotFoundError(f"No se encontró el dataset base: {DATASET_BASE_PATH}")

print(f"Cargando dataset base desde: {DATASET_BASE_PATH}")
df_base = pd.read_csv(DATASET_BASE_PATH)

df = df_base.copy()

# Si existe archivo de nuevos casos, lo concatenamos
if DATASET_NUEVOS_PATH.exists():
  print(f"Encontrado dataset de nuevos casos: {DATASET_NUEVOS_PATH}")
  df_nuevos = pd.read_csv(DATASET_NUEVOS_PATH)

  # Opcional: filtramos filas con tipo_lesion no nulo
  if "tipo_lesion" in df_nuevos.columns:
    df_nuevos = df_nuevos[~df_nuevos["tipo_lesion"].isna()]

  if not df_nuevos.empty:
    print(f"Concatenando {len(df_nuevos)} filas nuevas al dataset base...")
    df = pd.concat([df, df_nuevos], ignore_index=True)
  else:
    print("dataset_soccerprev_nuevos.csv está vacío o sin tipo_lesion; no se concatena.")
else:
  print("No se encontró dataset_soccerprev_nuevos.csv, se entrena solo con dataset.csv.")

print(f"Total de filas para entrenamiento: {len(df)}")


# ==========================
#  DEFINICIÓN DE FEATURES Y TARGET
# ==========================

num_cols = [
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
]

cat_cols = ["nivel", "superficie", "clima"]

# Normalizamos el target a minúsculas y sin espacios
df["tipo_lesion"] = df["tipo_lesion"].astype(str).str.strip().str.lower()

label_map = {
  "esguince": 0,
  "desgarre": 1,
  "fractura": 2,
  "luxación": 3,
  "luxacion": 3,  # por si viene sin tilde
  "otra": 4,
  "otra lesión": 4,
  "otra lesion": 4
}

y = df["tipo_lesion"].map(label_map)

# Eliminamos filas donde el target no se puede mapear
mask_valid = ~y.isna()
df = df[mask_valid].reset_index(drop=True)
y = y[mask_valid].astype(int)

X = df[num_cols + cat_cols]

print("\nDistribución de clases (después de limpieza):")
print(pd.Series(y).value_counts().sort_index())
print("\nClases (0=esguince, 1=desgarre, 2=fractura, 3=luxación, 4=otra)\n")


# ==========================
#  PIPELINE DE PREPROCESO
# ==========================

num_tf = Pipeline(
  steps=[
    ("imp", SimpleImputer(strategy="median")),
    ("sc", StandardScaler()),
  ]
)

cat_tf = Pipeline(
  steps=[
    ("imp", SimpleImputer(strategy="most_frequent")),
    ("ohe", OneHotEncoder(handle_unknown="ignore")),
  ]
)

pre = ColumnTransformer(
  transformers=[
    ("num", num_tf, num_cols),
    ("cat", cat_tf, cat_cols),
  ],
  remainder="drop",
)

# ==========================
#  MODELO
# ==========================

rf = RandomForestClassifier(
  n_estimators=300,
  class_weight="balanced",
  random_state=42,
  n_jobs=-1,
)

pipe = Pipeline(
  steps=[
    ("pre", pre),
    ("clf", rf),
  ]
)

# ==========================
#  TRAIN / TEST SPLIT
# ==========================

X_tr, X_te, y_tr, y_te = train_test_split(
  X,
  y,
  test_size=0.2,
  stratify=y,
  random_state=42,
)

print(f"Filas train: {len(X_tr)}  ·  Filas test: {len(X_te)}")

# ==========================
#  ENTRENAMIENTO
# ==========================

pipe.fit(X_tr, y_tr)

# ==========================
#  EVALUACIÓN RÁPIDA
# ==========================

y_pred = pipe.predict(X_te)
print("\nReporte de clasificación (hold-out 20%):\n")
print(classification_report(y_te, y_pred, zero_division=0))

# ==========================
#  GUARDAR MODELO
# ==========================

joblib.dump(pipe, MODEL_PATH)
print(f"\nModelo entrenado y guardado en: {MODEL_PATH}")
print("\nRecuerda que predict.py carga exactamente este archivo.\n")