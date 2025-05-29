FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite domyślnie nasłuchuje na 0.0.0.0!
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
