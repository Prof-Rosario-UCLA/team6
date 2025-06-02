FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm run dist
COPY . .
RUN npm install
EXPOSE 1919
CMD ["node", "app.js"]
