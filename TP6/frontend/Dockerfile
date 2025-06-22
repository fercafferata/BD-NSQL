FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY public/ ./public/
COPY src/ ./src/
COPY . .

EXPOSE 3000

ENV REACT_APP_API_URL=http://localhost:3001

CMD ["npm", "start"]
