#!/usr/bin/env bash
set -eux

echo "🔧 Installing Chromium and required dependencies..."

apt-get update
apt-get install -y chromium ca-certificates fonts-liberation libappindicator3-1 \
libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 \
libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
xdg-utils

which chromium || which chromium-browser || echo "❌ No Chromium binary found."
echo "✅ Chromium dependencies installed successfully."
