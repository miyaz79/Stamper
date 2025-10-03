# ベース: Node 20 + 開発用ユーティリティ
FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# 便利ツールとビルドに必要なパッケージ
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    git ca-certificates zip unzip jq make bash-completion curl gnupg \
    python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

# pipx is not available in Debian bullseye main repo; install via pip and then use it to install aws-sam-cli
RUN python3 -m pip install --no-cache-dir --upgrade pip \
 && python3 -m pip install --no-cache-dir pipx \
 && python3 -m pipx ensurepath || true \
 && /root/.local/bin/pipx install aws-sam-cli || pipx install aws-sam-cli

# node ユーザの PATH に pipx バイナリを通す
ENV PATH="/usr/local/bin:/root/.local/bin:/home/node/.local/bin:${PATH}"

# 作業ディレクトリ（Dev Container が /workspaces/Stamper をマウント）
WORKDIR /workspaces/Stamper
