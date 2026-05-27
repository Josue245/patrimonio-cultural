<?php

declare(strict_types=1);

namespace App\Application\Ports\Contracts;

use App\Application\DTOs\RegistroMovilDTO;

interface RegistrarBienMovilPortInterface
{
    public function ejecutar(RegistroMovilDTO $dto): array;
}