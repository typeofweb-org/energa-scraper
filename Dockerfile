FROM node:18-alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

RUN npm install -g pnpm@7

COPY package.json ./
COPY pnpm-lock.json ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD [ "pnpm", "start" ]
