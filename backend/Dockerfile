FROM php:8.3-cli-alpine

# Install system libraries needed by Laravel and PHP extensions
RUN apk add --no-cache \
    curl \
    git \
    zip \
    unzip \
    sqlite-dev \
    icu-dev \
    libpng-dev \
    libxml2-dev \
    oniguruma-dev \
    && docker-php-ext-install pdo pdo_sqlite mbstring opcache intl bcmath

# Get official Composer binary
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Allow Composer to run as superuser inside Docker
ENV COMPOSER_ALLOW_SUPERUSER=1

# Set working directory
WORKDIR /var/www

# Copy composer files first for optimal Docker layer caching
COPY composer.json composer.lock ./

# Install dependencies with --ignore-platform-reqs to guarantee installation
RUN composer install --no-dev --no-scripts --optimize-autoloader --no-interaction --ignore-platform-reqs

# Copy all application code
COPY . .

# Setup directories, sqlite db file, and permissions
RUN mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && touch database/database.sqlite \
    && chmod -R 777 storage bootstrap/cache database

# Render injects PORT env variable
ENV PORT=10000
EXPOSE ${PORT}

# Discover packages, run migrations, and start server
CMD sh -c "php artisan package:discover --ansi && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=\${PORT:-10000}"
