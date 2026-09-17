#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Upgrading pip..."
pip install --upgrade pip

echo "==> Installing project dependencies..."
pip install -r requirements.txt

echo "==> Running Django collectstatic..."
python manage.py collectstatic --no-input

echo "==> Running Django database migrations..."
python manage.py migrate

echo "==> Build complete!"
