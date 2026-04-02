<?php

namespace App\Application\Ports\Contracts;

interface GeoServicioPortInterface
{
    /**
     * Georreferencia una dirección o nombre de lugar y retorna lat/lon.
     */
    public function geocodificar(string $lugar): array;

    /**
     * Genera una ruta cultural dado un array de puntos de interés.
     *
     * @param array $puntosInteres [['lat'=>..., 'lon'=>...], ...]
     */
    public function generarRuta(array $puntosInteres): array;

    /**
     * Retorna bienes culturales UNESCO cercanos importados por API.
     */
    public function obtenerPatrimonioUNESCO(float $latitud, float $longitud, float $radioKm): array;
}
