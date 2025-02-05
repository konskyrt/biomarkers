# Stage 1: Build the React frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Set up the Flask backend
FROM python:3.10-slim AS backend
WORKDIR /app
COPY backend/ ./backend
COPY --from=frontend-build /app/frontend/build ./backend/static  # Serve React build from Flask

RUN pip install --no-cache-dir -r backend/requirements.txt

# Expose Flask port
EXPOSE 5000

# Start the Flask backend with Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:5000", "backend.app:app"]
