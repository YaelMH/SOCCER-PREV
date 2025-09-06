
"""
Aquí entrenamos el pipeline de ML (preprocesamiento Y RandomForest) paraclasificar el tipo de lesión. El modelo final lo guardo en ml/modelo.pkl
para usarlo desde predict.py (llamado por el backend Node).
Se manejaran:
- Columnas numéricas: edad, peso, estatura_m, imc, frecuencia_juego_semana,
  duracion_partido_min, carga_total_min, entrena, calienta, calentamiento_min,
  horas_sueno, hidratacion_ok, lesiones_ultimo_anno, recuperacion_sem, posicion.
- Columnas categóricas: nivel, superficie, clima.
- Objetivo: tipo_lesion en minúsculas {esguince, desgarre, fractura, luxación, otra}.
"""

import pandas as pd, joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# Carga el dataset ya limpio/normalizado. BUSCARE LIMPIARLO CON UN SCRIPT PERO POR EL MOMENTO NO ESTÁ
df = pd.read_csv("ml/dataset.csv")

# Defino qué columnas trato como numéricas y cuáles como categóricas.
#    la"posicion" aquí la manejamos como numérica (0..3) por cómo la mapeé.
num_cols = [
    "edad", "peso", "estatura_m", "imc",
    "frecuencia_juego_semana", "duracion_partido_min", "carga_total_min",
    "entrena", "calienta", "calentamiento_min",
    "horas_sueno", "hidratacion_ok", "lesiones_ultimo_anno", "recuperacion_sem",
    "posicion"  # (0..3)
]
cat_cols = ["nivel", "superficie", "clima"]

# Mapeo el target a etiquetas numéricas (esto me simplifica el entrenamiento).
label_map = {"esguince": 0, "desgarre": 1, "fractura": 2, "luxación": 3, "otra": 4}
y = df["tipo_lesion"].map(label_map)

# Selecciono mis features (numéricas + categóricas).
X = df[num_cols + cat_cols]

# Armo el preprocesamiento:
#  num_tf: imputo medianas y escalo con StandardScaler
#  cat_tf: imputo más frecuente y hago One-Hot; ignoro categorías no vistas en el  train
num_tf = Pipeline([
    ("imp", SimpleImputer(strategy="median")),
    ("sc", StandardScaler())
])
cat_tf = Pipeline([
    ("imp", SimpleImputer(strategy="most_frequent")),
    ("ohe", OneHotEncoder(handle_unknown="ignore"))
])

# ColumnTransformer para aplicar cada pipeline a su subconjunto de columnas.
pre = ColumnTransformer([
    ("num", num_tf, num_cols),
    ("cat", cat_tf, cat_cols)
], remainder="drop")

#Defino mi modelo base: RandomForest. Uso class_weight="balanced" por si el dataset está desbalanceado.
rf = RandomForestClassifier(
    n_estimators=300,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

#Encadeno todo en un único Pipeline: preprocesamiento + clasificador.
pipe = Pipeline([
    ("pre", pre),
    ("clf", rf)
])

#Split en capas para mantener proporciones de clases en el train.
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# Entreno el pipeline completo directamente sobre los datos crudos.
pipe.fit(X_tr, y_tr)

# Evaluación rápida en el hold-out. "OJO" NECESITAMOS MAS DATOS PARA QUE SEA ESTABLE
y_pred = pipe.predict(X_te)
print(classification_report(y_te, y_pred, zero_division=0))


# el pipeline listo para inferencia en predict.py.
joblib.dump(pipe, "ml/modelo.pkl")
print("Modelo entrenado y guardado en ml/modelo.pkl")

# CHECAR:
# - Si el dataset es pequeño, conviene además evaluar con validación cruzada (StratifiedKFold) o bien recolectar más respuestas para estabilizar métricas.

