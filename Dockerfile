FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y git unzip libcurl4-openssl-dev libxml2-dev libonig-dev \
    && docker-php-ext-install curl mbstring xml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Pengaturan production: error hanya dicatat di log, tidak ditampilkan ke pengguna.
# Batas upload disamakan dengan JOURNAL_PHOTO_MAX_BYTES (5 MB) di journals.php.
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf 'expose_php = Off\nupload_max_filesize = 5M\npost_max_size = 8M\n' > "$PHP_INI_DIR/conf.d/senara.ini"

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --optimize-autoloader

COPY . .

RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /var/www/html/public>\n\tAllowOverride All\n\tRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/senara.conf \
    && printf '%s\n' \
        'Header always set X-Frame-Options "DENY"' \
        'Header always set X-Content-Type-Options "nosniff"' \
        'Header always set Referrer-Policy "strict-origin-when-cross-origin"' \
        "Header always set Content-Security-Policy \"frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'\"" \
        >> /etc/apache2/conf-available/senara.conf \
    && a2enmod headers \
    && a2enconf senara

EXPOSE 8080

CMD sed -i "s/Listen 80/Listen ${PORT:-8080}/" /etc/apache2/ports.conf \
    && sed -i "s/:80>/:${PORT:-8080}>/" /etc/apache2/sites-available/000-default.conf \
    && apache2-foreground
