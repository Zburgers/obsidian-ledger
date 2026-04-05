FROM node:22-alpine AS builder

ARG VITE_API_BASE
ARG VITE_API_HOST
ARG VITE_API_PORT
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_API_HOST=$VITE_API_HOST
ENV VITE_API_PORT=$VITE_API_PORT

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
