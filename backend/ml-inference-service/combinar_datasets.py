import pandas as pd

# 1. Cargar datasets
original = pd.read_csv("dataset_soccerprev.csv")
sintetico = pd.read_csv("dataset_transfermark.csv")

# 2. Unir datasets
df_combinado = pd.concat([original, sintetico], ignore_index=True)

# 3. Guardar resultado
df_combinado.to_csv("dataset.csv", index=False)

print(f"Dataset combinado creado con {df_combinado.shape[0]} registros totales.")