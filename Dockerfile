FROM node:23-alpine
WORKDIR /app
COPY my-game-frontend/package*.json ./
COPY my-game-frontend/ .
RUN npm install
EXPOSE 5173
# RUN npm run build
CMD ["npm", "run", "deploy"]