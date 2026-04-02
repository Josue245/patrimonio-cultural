<?php

namespace App\Domain\BienCultural\ValueObjects;

enum TipoPatrimonio: string
{
    case ARQUEOLOGICO  = 'arqueologico';
    case INMATERIAL    = 'inmaterial';
    case DOCUMENTAL    = 'documental';
    case ARQUITECTONICO = 'arquitectonico';
    case NATURAL       = 'natural';

    public function label(): string
    {
        return match($this) {
            self::ARQUEOLOGICO   => 'Arqueológico',
            self::INMATERIAL     => 'Patrimonio Inmaterial',
            self::DOCUMENTAL     => 'Documental',
            self::ARQUITECTONICO => 'Arquitectónico',
            self::NATURAL        => 'Natural',
        };
    }
}
