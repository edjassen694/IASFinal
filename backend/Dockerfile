FROM php:8.3-cli-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    curl \
    git \
    zip \
    unzip \
    sqlite-dev \
    libpng-dev \
    oniguruma-dev \
    && docker-php-ext-install pdo pdo_sqlite mbstring opcache

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . .

# Install dependencies (skipping scripts during build since .env is injected at runtime)
RUN composer install --no-dev --no-scripts --optimize-autoloader --no-interaction

# Ensure database directory and sqlite file exist
RUN mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && touch database/database.sqlite \
    && chmod -R 777 storage bootstrap/cache database

# Render sets PORT env variable (usually 10000)
ENV PORT=10000
EXPOSE ${PORT}

# Run migrations and start Laravel server binding to Render's PORT
CMD sh -c "php artisan package:discover --ansi && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=\${PORT:-10000}"
