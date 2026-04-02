<?php

namespace App\Infrastructure\Http\Controllers;

use App\Application\Services\GestionPatrimonioService;
use App\Application\Ports\Contracts\GeoServicioPortInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RutaCulturalController extends BaseApiController
{
    public function __construct(
        private readonly GestionPatrimonioService $service,
        private readonly GeoServicioPortInterface $geoService,
    ) {}

    /**
     * Sugiere rutas culturales según tipo de patrimonio y ubicación del visitante.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'latitud'  => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'tipo'     => 'nullable|in:arqueologico,inmaterial,documental,arquitectonico,natural',
            'radio_km' => 'nullable|numeric|min:5|max:200',
        ]);

        $latitud  = (float) $request->get('latitud',  -12.0621);
        $longitud = (float) $request->get('longitud', -75.2049);
        $radioKm  = (float) $request->get('radio_km', 50);

        $bienes = $this->service->obtenerCercanos($latitud, $longitud, $radioKm);

        if (count($bienes) >= 2) {
            $puntos = array_map(fn($b) => [
                'lat' => $b->getCoordenadas()->getLatitud(),
                'lon' => $b->getCoordenadas()->getLongitud(),
            ], $bienes);

            $ruta = $this->geoService->generarRuta($puntos);
        } else {
            $ruta = [];
        }

        return $this->successResponse([
            'bienes' => array_map(fn($b) => $b->toArray(), $bienes),
            'ruta'   => $ruta,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        return $this->errorResponse('Ruta específica no implementada aún.', 501);
    }
}
