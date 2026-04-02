<?php define('LARAVEL_START',microtime(true));require '/var/www/vendor/autoload.php';$app=require '/var/www/bootstrap/app.php';echo $app->make('config')->get('services.django_ml.url');
