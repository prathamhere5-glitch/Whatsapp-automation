#!/usr/bin/env bash
echo "🔧 Installing Chromium dependencies..."
apt-get update
apt-get install -y chromium chromium-common chromium-driver \
  fonts-liberation libatk-bridge2.0-0 libgtk-3-0 libnss3 libxss1 libasound2
echo "✅ Chromium dependencies installed."
