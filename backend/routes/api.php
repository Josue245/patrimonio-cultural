<?php

use App\Infrastructure\Http\Controllers\AuthController;
use App\Infrastructure\Http\Controllers\BienCulturalController;
use App\Infrastructure\Http\Controllers\IAController;
use App\Infrastructure\Http\Controllers\MultimediaController;
use App\Infrastructure\Http\Controllers\RutaCulturalController;
use App\Infrastructure\Http\Controllers\ReporteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Patrimonio Cultural Digital Andino
| Base: /api/v1/...
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Autenticacion ──────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('login',    [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']);
        Route::middleware('auth:api')->group(function () {
            Route::get('me',       [AuthController::class, 'me']);
            Route::post('logout',  [AuthController::class, 'logout']);
            Route::post('refresh', [AuthController::class, 'refresh']);
        });
    });

    // ── IA / Groq ──────────────────────────────────────────────────────────
    Route::prefix('ia')->group(function () {
    Route::get('estado',              [IAController::class, 'estado']);
    Route::post('clasificar',         [IAController::class, 'clasificar']);
    Route::post('detectar-duplicado', [IAController::class, 'detectarDuplicado']);
    Route::post('similar',            [IAController::class, 'similar']);
    Route::middleware('auth:api')->group(function () {
        Route::post('analizar',            [IAController::class, 'analizar']);
        Route::post('generar-descripcion', [IAController::class, 'generarDescripcion']);
    });
});

    // ── Publicas ───────────────────────────────────────────────────────────
    Route::get('bienes-culturales',      [BienCulturalController::class, 'index']);
    Route::get('bienes-culturales/{id}', [BienCulturalController::class, 'show']);
    Route::get('busqueda',               [BienCulturalController::class, 'busquedaAvanzada']);
    Route::get('mapa/bienes',            [BienCulturalController::class, 'cercanos']);
    Route::get('rutas-culturales',       [RutaCulturalController::class, 'index']);

    // ── Autenticadas ───────────────────────────────────────────────────────
    Route::middleware('auth:api')->group(function () {
        Route::middleware('role:investigador,administrador')->group(function () {
            Route::post('multimedia/upload',               [MultimediaController::class, 'upload']);
            Route::delete('multimedia/{id}',               [MultimediaController::class, 'destroy']);
            Route::get('bienes-culturales/{id}/ficha-pdf', [BienCulturalController::class, 'exportarFicha']);
        });
        Route::middleware('role:administrador')->group(function () {
            Route::post('bienes-culturales',        [BienCulturalController::class, 'store']);
            Route::put('bienes-culturales/{id}',    [BienCulturalController::class, 'update']);
            Route::delete('bienes-culturales/{id}', [BienCulturalController::class, 'destroy']);
            Route::get('reportes/estadisticas',     [BienCulturalController::class, 'estadisticas']);
            Route::get('reportes/exportar',         [ReporteController::class, 'exportar']);
        });
    });
});
