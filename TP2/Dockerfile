# Imagen base de Node
FROM node:18

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos del proyecto
COPY package*.json ./
COPY . .

# Instalar dependencias
RUN npm install

# Exponer el puerto del servidor
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "app.js"]
