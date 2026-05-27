<?php

declare(strict_types=1);

namespace App\Domain\ValueObjects;

// ─────────────────────────────────────────────────────────────
// Value Object: MultimediaId
// ─────────────────────────────────────────────────────────────
final class MultimediaId
{
    private function __construct(private readonly string $value) {}

    public static function generar(): self
    {
        return new self((string) \Illuminate\Support\Str::uuid());
    }

    public static function desde(string $value): self
    {
        if (! preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value)) {
            throw new \InvalidArgumentException("MultimediaId inválido: {$value}");
        }
        return new self($value);
    }

    public function value(): string { return $this->value; }

    public function equals(self $other): bool { return $this->value === $other->value; }

    public function __toString(): string { return $this->value; }
}


// ─────────────────────────────────────────────────────────────
// Value Object: TipoMultimedia
// ─────────────────────────────────────────────────────────────
enum TipoMultimedia: string
{
    case FOTO  = 'foto';
    case AUDIO = 'audio';

    public static function fromMimeType(string $mimeType): self
    {
        if (str_starts_with($mimeType, 'image/')) return self::FOTO;
        if (str_starts_with($mimeType, 'audio/')) return self::AUDIO;
        throw new \DomainException("Tipo MIME no soportado para multimedia: {$mimeType}");
    }
}


// ─────────────────────────────────────────────────────────────
// Value Object: CoordenadasGPS
// ─────────────────────────────────────────────────────────────
final class CoordenadasGPS
{
    private function __construct(
        public readonly float  $latitud,
        public readonly float  $longitud,
        public readonly ?float $altitud   = null,
        public readonly ?int   $precision = null,   // metros
    ) {}

    public static function crear(
        float  $latitud,
        float  $longitud,
        ?float $altitud   = null,
        ?int   $precision = null,
    ): self {
        if ($latitud  < -90  || $latitud  > 90)  {
            throw new \DomainException("Latitud inválida: {$latitud}. Rango: -90 a 90.");
        }
        if ($longitud < -180 || $longitud > 180) {
            throw new \DomainException("Longitud inválida: {$longitud}. Rango: -180 a 180.");
        }

        return new self($latitud, $longitud, $altitud, $precision);
    }

    /**
     * Región de Junín: valida que las coordenadas estén en la región.
     * Bounding box aproximado de Junín, Perú.
     */
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
