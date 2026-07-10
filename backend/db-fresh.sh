#!/bin/bash
echo "Menghapus database lama..."
rm -rf samling.db

echo "Membuat database baru..."
PYTHONPATH=. .venv/bin/alembic upgrade head

echo "Menjalankan seed data..."
PYTHONPATH=. .venv/bin/python app/database/seed.py
echo "✅ Database fresh & seeded dengan sukses!"