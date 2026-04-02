<?php

namespace App\Domain\BienCultural\Factories;

use App\Domain\BienCultural\Entities\BienCultural;
use App\Domain\BienCultural\ValueObjects\EstadoConservacion;
use App\Domain\BienCultural\ValueObjects\GeoPoint;
use App\Domain\BienCultural\ValueObjects\TipoPatrimonio;

class BienCulturalFactory
{
    public function crear(
        string $id,
        string $nombre,
        TipoPatrimonio $tipo,
        string $descripcion,
        float $latitud,
        float $longitud,
        ?float $altitud,
        EstadoConservacion $estado,
        string $regionGeografica,
        string $periodoHistorico,
        string $idioma = 'es',
        ?string $comunidadId = null,
    ): BienCultural {
        return new BienCultural(
            id:               $id,
            nombre:           $nombre,
            tipo:             $tipo,
            descripcion:      $descripcion,
            coordenadas:      new GeoPoint($latitud, $longitud, $altitud),
            estado:           $estado,
            regionGeografica: $regionGeografica,
            periodoHistorico: $periodoHistorico,
            idioma:           $idioma,
            comunidadId:      $comunidadId,
        );
    }
}
