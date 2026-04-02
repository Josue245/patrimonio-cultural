<?php
namespace App\Infrastructure\External\Geo;

use App\Application\Ports\Contracts\GeoServicioPortInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleMapsGeoServicio implements GeoServicioPortInterface
{
    private string $nominatimUrl = 'https://nominatim.openstreetmap.org';

    public function geocodificar(string $lugar): array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'PatrimonioCulturalAndino/1.0'
            ])->get("{$this->nominatimUrl}/search", [
                'q'               => $lugar,
                'format'          => 'json',
                'limit'           => 1,
                'countrycodes'    => 'pe',
            ]);

            $data = $response->json();

            if (!empty($data)) {
                return [
                    'latitud'  => (float) $data[0]['lat'],
                    'longitud' => (float) $data[0]['lon'],
                ];
            }
        } catch (\Throwable $e) {
            Log::error('GeoServicio::geocodificar: ' . $e->getMessage());
        }

        return [];
    }

    public function generarRuta(array $puntosInteres): array
    {
        if (count($puntosInteres) < 2) {
            return ['puntos' => $puntosInteres, 'distancia_km' => 0];
        }

        try {
            $coordenadas = array_map(
                fn($p) => "{$p['lon']},{$p['lat']}",
                $puntosInteres
            );

            $response = Http::withHeaders([
                'User-Agent' => 'PatrimonioCulturalAndino/1.0'
            ])->get('https://router.project-osrm.org/route/v1/driving/' . implode(';', $coordenadas), [
                'overview'    => 'full',
                'geometries'  => 'polyline',
            ]);

            $data = $response->json();

            if (isset($data['routes'][0])) {
                $ruta = $data['routes'][0];
                return [
                    'polyline'     => $ruta['geometry'],
                    'distancia_km' => round($ruta['distance'] / 1000, 2),
                    'duracion_min' => round($ruta['duration'] / 60, 2),
                ];
            }
        } catch (\Throwable $e) {
            Log::error('GeoServicio::generarRuta: ' . $e->getMessage());
        }

        return ['puntos' => $puntosInteres];
    }

    public function obtenerPatrimonioUNESCO(float $latitud, float $longitud, float $radioKm): array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'PatrimonioCulturalAndino/1.0'
            ])->get('https://whc.unesco.org/en/list/xml/');

            $xml   = simplexml_load_string($response->body());
            $items = [];

            foreach ($xml->row as $row) {
                $items[] = [
                    'nombre'    => (string) $row->site,
                    'pais'      => (string) $row->states,
                    'lat'       => (float)  $row->latitude,
                    'lon'       => (float)  $row->longitude,
                    'categoria' => (string) $row->category,
                ];
            }

            return $items;
        } catch (\Throwable $e) {
            Log::error('GeoServicio::obtenerPatrimonioUNESCO: ' . $e->getMessage());
            return [];
        }
    }
}