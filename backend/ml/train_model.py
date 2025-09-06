# -*- coding: utf-8 -*-
import pandas as pd, joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

df = pd.read_csv("ml/dataset.csv")

# columnas
num_cols = [
    "edad","peso","estatura_m","imc",
    "frecuencia_juego_semana","duracion_partido_min","carga_total_min",
    "entrena","calienta","calentamiento_min",
    "horas_sueno","hidratacion_ok","lesiones_ultimo_anno","recuperacion_sem",
    "posicion"  # (0..3)
]
cat_cols = ["nivel","superficie","clima"]

# target
y = df["tipo_lesion"].map({"esguince":0,"desgarre":1,"fractura":2,"luxación":3,"otra":4})
X = df[num_cols + cat_cols]

# preprocesamiento
num_tf = Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())])
cat_tf = Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                   ("ohe", OneHotEncoder(handle_unknown="ignore"))])

pre = ColumnTransformer([("num", num_tf, num_cols),
                         ("cat", cat_tf, cat_cols)], remainder="drop")

rf = RandomForestClassifier(
    n_estimators=300, class_weight="balanced", random_state=42, n_jobs=-1
)

pipe = Pipeline([("pre", pre), ("clf", rf)])

X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

pipe.fit(X_tr, y_tr)
y_pred = pipe.predict(X_te)
print(classification_report(y_te, y_pred, zero_division=0))

joblib.dump(pipe, "ml/modelo.pkl")
print("Modelo entrenado y guardado en ml/modelo.pkl")
