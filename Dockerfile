FROM node:22-alpine
ARG TARGETPLATFORM
ENV TARGETPLATFORM=${TARGETPLATFORM:-linux/amd64}
ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH:-amd64}

ENV NODE_ENV production
ENV PUPPETEER_SKIP_DOWNLOAD false

WORKDIR /usr/src/app

RUN corepack enable
RUN apk add chromium

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD [ "pnpm", "start" ]
