<?php

declare(strict_types=1);

namespace App\Domain\BienCultural\ValueObjects;

final class CoordenadasGPS
{
    private function __construct(
        public readonly float  $latitud,
        public readonly float  $longitud,
        public readonly ?float $altitud   = null,
        public readonly ?int   $precision = null,
    ) {}

    public static function crear(
        float  $latitud,
        float  $longitud,
        ?float $altitud   = null,
        ?int   $precision = null,
    ): self {
        if ($latitud  < -90  || $latitud  > 90) {
            throw new \DomainException("Latitud inválida: {$latitud}");
        }
        if ($longitud < -180 || $longitud > 180) {
            throw new \DomainException("Longitud inválida: {$longitud}");
        }
        return new self($latitud, $longitud, $altitud, $precision);
    }

    public function estaEnRegionJunin(): bool
    {
        return $this->latitud  >= -13.0 && $this->latitud  <= -10.5
            && $this->longitud >= -76.5 && $this->longitud <= -73.5;
    }

    public function toArray(): array
    {
        return [
            'latitud'   => $this->latitud,
            'longitud'  => $this->longitud,
            'altitud'   => $this->altitud,
            'precision' => $this->precision,
        ];
    }

    public function __toString(): string
    {
        return "{$this->latitud}, {$this->longitud}";
    }
}