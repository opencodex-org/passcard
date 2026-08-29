#!/usr/bin/env bash

set -e

echo "Starting PassCard deployment..."

npx wrangler pages deploy ./public \
  --project-name passcard

echo "PassCard deployment completed."
echo "https://passcard.pages.dev"
