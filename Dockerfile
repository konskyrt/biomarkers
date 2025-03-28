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
FROM python:3.10-slim
WORKDIR /app

# Create a dedicated temp directory with proper permissions
RUN mkdir -p /app/temp && chmod 777 /app/temp
ENV TMPDIR=/app/temp

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into /app/backend
COPY backend/ ./backend

# Copy the React build from the frontend stage into the backend static folder
COPY --from=frontend-build /app/frontend/build ./backend/static

EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "--timeout", "250", "backend.main:app"]
