FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm ci
COPY . .
RUN npm run build

FROM node:20
WORKDIR /app
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY gear.csv ./
RUN mkdir -p /app/data
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
