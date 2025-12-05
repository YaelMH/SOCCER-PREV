FROM node:20-bullseye

# Python para el modelo
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Carpeta raíz del backend dentro del contenedor
WORKDIR /app

# 1) Copiamos package.json y package-lock solo del servicio de recomendación
COPY recommendation-service/package*.json ./recommendation-service/

# 2) Instalamos dependencias de Node dentro de recommendation-service
WORKDIR /app/recommendation-service
RUN npm install --omit=dev

# 3) Volvemos a /app y copiamos TODO el backend (ml-inference-service + recommendation-service + data, etc.)
WORKDIR /app
COPY . .

# 4) Entramos de nuevo al servicio para ejecutarlo
WORKDIR /app/recommendation-service

ENV PORT=3000
ENV PYTHON_CMD=python3

EXPOSE 3000

CMD ["npm", "start"]