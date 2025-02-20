# Stage 1: Build React frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ . 
RUN npm run build
# Add this line after `RUN npm run build` in the frontend stage
RUN ls -la /app/frontend/build  # Verify build dir exists

# Stage 2: Build Flask backend
FROM python:3.10-slim
WORKDIR /app

# Copy backend files
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend

# Copy React build files from frontend stage
COPY --from=frontend-build /app/frontend/build ./backend/static

EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "backend.app:app"]
