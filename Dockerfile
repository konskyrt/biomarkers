FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Build the project
RUN npm run build

# Serve the build folder using a simple static server
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
