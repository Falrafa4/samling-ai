#!/bin/bash
echo "Menghapus database lama..."
if [ -d ".venv" ]; then
    PYTHONPATH=. .venv/bin/python app/database/clear_db.py
else
    PYTHONPATH=. python3 app/database/clear_db.py
fi

echo "Membuat database baru..."
if [ -d ".venv" ]; then
    PYTHONPATH=. .venv/bin/alembic upgrade head
else
    PYTHONPATH=. alembic upgrade head
fi

echo "Menjalankan seed data..."
if [ -d ".venv" ]; then
    PYTHONPATH=. .venv/bin/python app/database/seed.py
    PYTHONPATH=. .venv/bin/python app/database/seed_historical_waste_data.py
else
    PYTHONPATH=. python3 app/database/seed.py
    PYTHONPATH=. python3 app/database/seed_historical_waste_data.py
fi
echo "✅ Database fresh & seeded dengan sukses!"