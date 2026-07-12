FROM node:18-bullseye
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build || true
EXPOSE 3000
CMD ["npm", "run", "dev"]
