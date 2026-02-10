# KASBI MAN (Angular + FastAPI)

## Быстрый запуск

### 1) Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend (Angular)

```bash
cd frontend
npm install
npm run start
```

Откройте: <http://localhost:4200>

## Частые ошибки

### `ng: not found`
Используйте локальный CLI через npm-скрипт (`npm run start`) и запускайте именно из папки `frontend`.

### `MODULE_NOT_FOUND ... @angular/cli/bin/ng.js`
Значит зависимости не установлены в `frontend/node_modules`.

```bash
cd frontend
npm install
npm ls @angular/cli
```

### Frontend не видит backend
Проверьте, что backend запущен на `http://localhost:8000`.
