FROM node:18-alpine as client-builder

# Construir el frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Etapa final para el servidor
FROM node:18-alpine

# Configurar el backend
WORKDIR /app
COPY server/package*.json ./
RUN npm install --only=production
COPY server ./

# Copiar los archivos build del frontend
COPY --from=client-builder /app/client/build ./public

# Crear un usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar la propiedad de los archivos al usuario nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer el puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Comando para iniciar la aplicación
CMD ["npm", "start"]
