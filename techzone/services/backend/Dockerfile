FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --production

FROM node:18-alpine AS runner
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV PORT=3001

COPY --from=deps /app/node_modules ./node_modules

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
