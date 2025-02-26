FROM node:20-slim AS yarn-install

WORKDIR /yarn-install

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install --frozen-lockfile

FROM node:20-slim AS build

WORKDIR /app

COPY . .

COPY --from=yarn-install /yarn-install/node_modules ./node_modules/

# Set Dapr CLI version
ENV DAPR_CLI_VERSION=1.14.4

# Download and install Dapr CLI
RUN wget -q https://github.com/dapr/cli/releases/download/v${DAPR_CLI_VERSION}/dapr_linux_amd64.tar.gz \
    && tar -zxvf dapr_linux_amd64.tar.gz \
    && mv ./dapr /usr/local/bin/ \
    && rm dapr_linux_amd64.tar.gz

# Initialize Dapr (downloads and installs Dapr runtime)
# The --slim flag installs only the necessary components
RUN dapr init --slim

# Verify installation
RUN dapr --version

# RUN yarn tsc
RUN yarn build

EXPOSE 5173

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
