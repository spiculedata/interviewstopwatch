FROM node:20-slim AS yarn-install

WORKDIR /yarn-install

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install --frozen-lockfile

FROM node:20-slim AS build

WORKDIR /app

COPY . .

COPY --from=yarn-install /yarn-install/node_modules ./node_modules/

# install dapr 
RUN wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash

RUN yarn tsc

EXPOSE 5173

RUN chmod +x ./entrypoint.sh

ENTRYPOINT [./entrypoint.sh]
