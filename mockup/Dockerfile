FROM node:22-alpine

WORKDIR /app

ENV CI=true \
    NG_CLI_ANALYTICS=ci

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200", "--serve-path", "/somo-convalidaciones", "--base-href", "/somo-convalidaciones/"]
