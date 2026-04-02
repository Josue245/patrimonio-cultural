<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn() => response()->json([
    'app'     => 'Patrimonio Cultural Digital Andino API',
    'version' => '1.0.0',
    'docs'    => '/api/documentation',
    'api'     => '/api/v1',
    'status'  => 'running',
]));
