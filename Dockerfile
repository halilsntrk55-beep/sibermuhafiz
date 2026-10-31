FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json server.mjs index.html style.css app.js accounts.js shield.svg ./
RUN mkdir -p /app/data && chown -R node:node /app
USER node
ENV HOST=0.0.0.0 PORT=4182 DB_PATH=/app/data/sibermuhafiz.sqlite
EXPOSE 4182
VOLUME ["/app/data"]
CMD ["node","server.mjs"]

