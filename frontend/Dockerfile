# Use an official Node runtime as a parent image
FROM node:20 AS build
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . ./
# Build the application
RUN npm run build

# Use a lightweight web server to serve the static files
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
