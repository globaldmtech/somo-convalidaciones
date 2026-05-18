# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build -- --configuration production

# Stage 2: Build runtime image for FastAPI backend
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend

# backend/app/main.py expects frontend dist at:
# /app/frontend/dist/frontend/browser
COPY --from=frontend-build /app/frontend/dist/frontend/browser /app/frontend/dist/frontend/browser

EXPOSE 8000

WORKDIR /app
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
