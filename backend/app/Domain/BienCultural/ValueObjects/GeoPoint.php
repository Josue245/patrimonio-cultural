<?php

namespace App\Domain\BienCultural\ValueObjects;

class GeoPoint
{
    public function __construct(
        private readonly float $latitud,
        private readonly float $longitud,
        private readonly ?float $altitud = null,
    ) {
        if ($latitud < -90 || $latitud > 90) {
            throw new \InvalidArgumentException("Latitud inválida: {$latitud}");
        }
        if ($longitud < -180 || $longitud > 180) {
            throw new \InvalidArgumentException("Longitud inválida: {$longitud}");
        }
    }

    public function getLatitud(): float { return $this->latitud; }
    public function getLongitud(): float { return $this->longitud; }
    public function getAltitud(): ?float { return $this->altitud; }

    public function toArray(): array
    {
        return [
            'latitud'  => $this->latitud,
            'longitud' => $this->longitud,
            'altitud'  => $this->altitud,
        ];
    }

    public function toWKT(): string
    {
        return "POINT({$this->longitud} {$this->latitud})";
    }
}
