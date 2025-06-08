FROM node:23-alpine as build
WORKDIR /app
COPY frontend/package*.json ./
COPY frontend/ .
RUN npm install
RUN npm run build
# CMD ["npm", "run", "serve"]

FROM ubuntu
RUN apt-get update
RUN apt-get install nginx -y
COPY --from=build /app/dist /var/www/html/
EXPOSE 80
CMD ["nginx","-g","daemon off;"]