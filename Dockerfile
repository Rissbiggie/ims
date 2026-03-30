  # Stage 1: Build Assets (Node.js)
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json vite.config.js tailwind.config.js ./
COPY resources ./resources
COPY public ./public 
RUN npm install && npm run build

# Stage 2: App Runtime (PHP 8.4)
FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    libsqlite3-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions + Redis
RUN pecl install redis && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_sqlite bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy all files
COPY . .

# Copy the "Magic" Manifest from Stage 1
COPY --from=frontend-builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader

# FIX: Set permissions for Storage AND Database (Crucial for SQLite)
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache /var/www/database \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache /var/www/database

# Nginx & Boot Scripts
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]