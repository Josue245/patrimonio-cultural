<?php
return [
    'default' => env('DB_CONNECTION', 'pgsql'),
    'connections' => [
        'pgsql' => [
            'driver'         => 'pgsql',
            'url'            => env('DATABASE_URL'),
            'host'           => env('DB_HOST', 'postgres'),
            'port'           => env('DB_PORT', '5432'),
            'database'       => env('DB_DATABASE', 'patrimonio_junin'),
            'username'       => env('DB_USERNAME', 'patrimonio_user'),
            'password'       => env('DB_PASSWORD', 'patrimonio_pass'),
            'charset'        => 'utf8',
            'prefix'         => '',
            'prefix_indexes' => true,
            'search_path'    => 'public',
            'sslmode'        => 'prefer',
        ],
    ],
    'migrations' => 'migrations',
];
