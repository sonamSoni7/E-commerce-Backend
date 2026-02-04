FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
# docker-compose up -d --build