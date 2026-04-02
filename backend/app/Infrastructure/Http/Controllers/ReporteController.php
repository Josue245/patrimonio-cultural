<?php

namespace App\Infrastructure\Http\Controllers;

use App\Application\Services\GestionPatrimonioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReporteController extends BaseApiController
{
    public function __construct(private readonly GestionPatrimonioService $service) {}

    public function exportar(Request $request): JsonResponse
    {
        $stats = $this->service->obtenerEstadisticas();
        return $this->successResponse($stats, 'Reporte generado.');
    }
}
