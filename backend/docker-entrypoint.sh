#!/bin/sh
set -e

cd /var/www

echo "[entrypoint] Running package:discover..."
php artisan package:discover --ansi 2>/dev/null || true

if ! grep -q "^APP_KEY=base64" .env 2>/dev/null; then
    echo "[entrypoint] Generating APP_KEY..."
    php artisan key:generate --force
fi

if grep -q "^JWT_SECRET=$" .env 2>/dev/null || ! grep -q "^JWT_SECRET=" .env 2>/dev/null; then
    echo "[entrypoint] Generating JWT_SECRET..."
    php artisan jwt:secret --force
fi

php artisan config:clear 2>/dev/null || true
php artisan cache:clear  2>/dev/null || true

echo "[entrypoint] Generating Swagger docs..."
php artisan l5-swagger:generate 2>/dev/null || true

echo "[entrypoint] Laravel ready."
exec "$@"
