<?php
return [
    'ses'        => ['key' => env('AWS_ACCESS_KEY_ID'), 'secret' => env('AWS_SECRET_ACCESS_KEY'), 'region' => env('AWS_DEFAULT_REGION', 'us-east-1')],
    'google_maps'=> ['key' => env('GOOGLE_MAPS_API_KEY')],
    'django_ml'  => ['url' => env('DJANGO_ML_URL', 'http://django-ml:8001'), 'internal_token' => env('ML_INTERNAL_TOKEN', 'patrimonio-ml-internal-2024')],
];
