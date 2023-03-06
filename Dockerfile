FROM node:18-alpine

ENV NODE_ENV production
ENV PUPPETEER_SKIP_DOWNLOAD true

WORKDIR /usr/src/app

RUN npm install -g pnpm@7
RUN apk add chromium

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD [ "pnpm", "start" ]
