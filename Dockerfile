FROM node:20-slim AS yarn-install

WORKDIR /yarn-install

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install --frozen-lockfile

FROM node:20-slim AS build

WORKDIR /app

COPY . .

COPY --from=yarn-install /yarn-install/node_modules ./node_modules/

# Set environment variables
ENV DAPR_CLI_VERSION=1.14.1
ENV DAPR_RUNTIME_VERSION=1.14.1

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Download and install Dapr CLI
RUN wget -q https://github.com/dapr/cli/releases/download/v${DAPR_CLI_VERSION}/dapr_linux_amd64.tar.gz \
    && tar -zxvf dapr_linux_amd64.tar.gz \
    && mv ./dapr /usr/local/bin/ \
    && rm dapr_linux_amd64.tar.gz

# Initialize Dapr (but don't start the containers since we're in a container)
# Using the slim init which doesn't install container instances
RUN dapr init --slim --runtime-version ${DAPR_RUNTIME_VERSION}

# Verify installation
RUN dapr --version

# RUN yarn tsc
RUN yarn build

EXPOSE 5173

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
