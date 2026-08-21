FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl locales && rm -rf /var/lib/apt/lists/* \
    && sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen \
    && locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
