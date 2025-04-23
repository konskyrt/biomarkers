# Stage 1: Build React frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ . 
RUN npm run build
# Optional: List the build folder for verification
RUN ls -la /app/frontend/build

# Stage 2: Build Flask backend
# Stage 2: Build Flask backend
FROM python:3.10-slim
WORKDIR /app

# Temp dir
RUN mkdir -p /app/temp && chmod 777 /app/temp
ENV TMPDIR=/app/temp

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend
COPY apps/    ./apps             

# Copy React build into static
COPY --from=frontend-build /app/frontend/build ./backend/static

# Ensure /app is on Python path
ENV PYTHONPATH=/app

EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "--timeout", "250", "backend.main:app"]
