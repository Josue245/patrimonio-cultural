<?php

namespace App\Application\DTOs;

class BienCulturalDTO
{
    public function __construct(
        public readonly string $nombre,
        public readonly string $tipo,
        public readonly string $descripcion,
        public readonly float  $latitud,
        public readonly float  $longitud,
        public readonly ?float $altitud,
        public readonly string $estado,
        public readonly string $regionGeografica,
        public readonly string $periodoHistorico,
        public readonly string $idioma = 'es',
        public readonly ?string $comunidadId = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            nombre:           $data['nombre'],
            tipo:             $data['tipo'],
            descripcion:      $data['descripcion'],
            latitud:          (float) $data['latitud'],
            longitud:         (float) $data['longitud'],
            altitud:          isset($data['altitud']) ? (float) $data['altitud'] : null,
            estado:           $data['estado'],
            regionGeografica: $data['region_geografica'],
            periodoHistorico: $data['periodo_historico'],
            idioma:           $data['idioma'] ?? 'es',
            comunidadId:      $data['comunidad_id'] ?? null,
        );
    }
}
