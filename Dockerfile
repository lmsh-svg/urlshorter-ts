FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install --production

EXPOSE 7860

CMD ["node", "server.js"]