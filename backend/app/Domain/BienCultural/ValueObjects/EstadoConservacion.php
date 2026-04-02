<?php

namespace App\Domain\BienCultural\ValueObjects;

enum EstadoConservacion: string
{
    case EXCELENTE  = 'excelente';
    case BUENO      = 'bueno';
    case REGULAR    = 'regular';
    case DETERIORADO = 'deteriorado';
    case CRITICO    = 'critico';

    public function label(): string
    {
        return match($this) {
            self::EXCELENTE   => 'Excelente',
            self::BUENO       => 'Bueno',
            self::REGULAR     => 'Regular',
            self::DETERIORADO => 'Deteriorado',
            self::CRITICO     => 'Crítico — requiere intervención urgente',
        };
    }
}
