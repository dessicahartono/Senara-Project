FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y git unzip libcurl4-openssl-dev libxml2-dev libonig-dev \
    && docker-php-ext-install curl mbstring xml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --optimize-autoloader

COPY . .

RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /var/www/html/public>\n\tAllowOverride All\n\tRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/senara.conf \
    && a2enconf senara

EXPOSE 8080

CMD sed -i "s/Listen 80/Listen ${PORT:-8080}/" /etc/apache2/ports.conf \
    && sed -i "s/:80>/:${PORT:-8080}>/" /etc/apache2/sites-available/000-default.conf \
    && apache2-foreground
