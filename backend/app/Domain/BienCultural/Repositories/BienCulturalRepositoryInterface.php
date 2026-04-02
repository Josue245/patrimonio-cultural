<?php

namespace App\Domain\BienCultural\Repositories;

use App\Domain\BienCultural\Entities\BienCultural;
use App\Domain\BienCultural\ValueObjects\TipoPatrimonio;

interface BienCulturalRepositoryInterface
{
    public function findById(string $id): ?BienCultural;

    public function findAll(int $page = 1, int $perPage = 15): array;

    public function save(BienCultural $bien): void;

    public function update(BienCultural $bien): void;

    public function delete(string $id): void;

    public function existeDuplicado(string $nombre, string $regionGeografica, ?string $excludeId = null): bool;

    /**
     * Búsqueda avanzada con filtros combinados.
     */
    public function buscar(
        ?string $query = null,
        ?TipoPatrimonio $tipo = null,
        ?string $region = null,
        ?string $periodo = null,
        ?string $estado = null,
        ?string $idioma = null,
        int $page = 1,
        int $perPage = 15,
    ): array;

    /**
     * Obtiene bienes dentro de un radio (en km) de un punto geográfico.
     */
    public function findCercanos(float $latitud, float $longitud, float $radioKm = 10): array;

    public function countByTipo(): array;

    public function countByRegion(): array;

    public function countByEstado(): array;
}
