<?php

namespace App\Infrastructure\External\IA;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DjangoMLAdapter
{
    private string $baseUrl;
    private int    $timeout;
    private string $internalToken;

    public function __construct()
{
    $this->baseUrl       = config('services.django_ml.url', 'http://django-ml:8001');
    $this->timeout       = 30;
    $this->internalToken = config('services.django_ml.internal_token', 'patrimonio-ml-internal-2024');
    Log::info("DjangoMLAdapter baseUrl: {$this->baseUrl}");
}

    public function clasificar(string $nombre, string $descripcion): array
{
    return $this->post('/api/ia/clasificar/', [
        'nombre'      => $nombre,
        'descripcion' => $descripcion,
    ], 'clasificar');
}

public function analizar(array $bien): array
{
    return $this->post('/api/ia/analizar/', ['bien' => $bien], 'analizar');
}

public function buscarSimilares(string $query, array $bienes, int $topK = 5): array
{
    return $this->post('/api/ia/similar/', [
        'query'  => $query,
        'bienes' => $bienes,
        'top_k'  => $topK,
    ], 'buscarSimilares');
}

public function detectarDuplicados(array $nuevo, array $existentes): array
{
    return $this->post('/api/ia/detectar-duplicado/', [
        'nuevo'      => $nuevo,
        'existentes' => $existentes,
    ], 'detectarDuplicados');
}

public function generarDescripcion(array $datos): array
{
    return $this->post('/api/ia/generar-descripcion/', ['datos' => $datos], 'generarDescripcion');
}

public function estadisticas(): array
{
    try {
        $response = Http::timeout(10)->get("{$this->baseUrl}/api/ia/estadisticas-ia/");
        if ($response->successful()) {
            return $response->json('data') ?? [];
        }
    } catch (\Throwable $e) {
        Log::error("DjangoMLAdapter::estadisticas: {$e->getMessage()}");
    }
    return ['groq_disponible' => false, 'error' => 'Servicio ML no disponible.'];
}

public function healthCheck(): bool
{
    try {
        $url = "{$this->baseUrl}/api/ia/estado/";
        Log::info("healthCheck llamando: {$url}");
        $response = Http::timeout(5)->get($url);
        Log::info("healthCheck status: {$response->status()}");
        return $response->successful();
    } catch (\Throwable $e) {
        Log::error("healthCheck error: {$e->getMessage()}");
        return false;
    }
}
    private function post(string $endpoint, array $payload, string $method): array
{
    try {
        $response = Http::timeout($this->timeout)
            ->post("{$this->baseUrl}{$endpoint}", $payload);

        if ($response->successful()) {
            $json = $response->json();
            return $json['data'] ?? $json;
        }

        Log::warning("DjangoMLAdapter::{$method} HTTP {$response->status()}");
    } catch (\Throwable $e) {
        Log::error("DjangoMLAdapter::{$method}: {$e->getMessage()}");
    }

    return ['success' => false, 'error' => 'Servicio ML no disponible.'];
}
}
