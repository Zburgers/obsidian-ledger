FROM node:22-alpine AS builder

ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx vite build

FROM node:22-alpine

RUN npm install -g serve

WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "dist", "-l", "5173", "--single"]
