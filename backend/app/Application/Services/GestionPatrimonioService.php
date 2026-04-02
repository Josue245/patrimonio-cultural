<?php

namespace App\Application\Services;

use App\Application\DTOs\BienCulturalDTO;
use App\Application\Ports\Contracts\NotificacionPortInterface;
use App\Application\Ports\Contracts\GeoServicioPortInterface;
use App\Domain\BienCultural\Entities\BienCultural;
use App\Domain\BienCultural\Factories\BienCulturalFactory;
use App\Domain\BienCultural\Repositories\BienCulturalRepositoryInterface;
use App\Domain\BienCultural\ValueObjects\EstadoConservacion;
use App\Domain\BienCultural\ValueObjects\TipoPatrimonio;
use Illuminate\Support\Str;

class GestionPatrimonioService
{
    public function __construct(
        private readonly BienCulturalRepositoryInterface $repository,
        private readonly NotificacionPortInterface       $notificador,
        private readonly GeoServicioPortInterface        $geoService,
        private readonly BienCulturalFactory             $factory,
    ) {}

    public function registrar(BienCulturalDTO $dto): BienCultural
    {
        // Detectar duplicados antes de guardar
        if ($this->repository->existeDuplicado($dto->nombre, $dto->regionGeografica)) {
            $this->notificador->notificarAdmin('duplicado_detectado', [
                'nombre'  => $dto->nombre,
                'region'  => $dto->regionGeografica,
            ]);
            throw new \DomainException("Ya existe un bien cultural con ese nombre en la región '{$dto->regionGeografica}'.");
        }

        $bien = $this->factory->crear(
            id:               Str::uuid()->toString(),
            nombre:           $dto->nombre,
            tipo:             TipoPatrimonio::from($dto->tipo),
            descripcion:      $dto->descripcion,
            latitud:          $dto->latitud,
            longitud:         $dto->longitud,
            altitud:          $dto->altitud,
            estado:           EstadoConservacion::from($dto->estado),
            regionGeografica: $dto->regionGeografica,
            periodoHistorico: $dto->periodoHistorico,
            idioma:           $dto->idioma,
            comunidadId:      $dto->comunidadId,
        );

        $this->repository->save($bien);

        return $bien;
    }

    public function actualizar(string $id, BienCulturalDTO $dto): BienCultural
    {
        $bien = $this->repository->findById($id);
        if (!$bien) {
            throw new \DomainException("Bien cultural no encontrado: {$id}");
        }

        if ($this->repository->existeDuplicado($dto->nombre, $dto->regionGeografica, $id)) {
            throw new \DomainException("Ya existe otro bien cultural con ese nombre en la región.");
        }

        $bien->actualizar(
            nombre:          $dto->nombre,
            descripcion:     $dto->descripcion,
            estado:          EstadoConservacion::from($dto->estado),
            periodoHistorico: $dto->periodoHistorico,
        );

        $this->repository->update($bien);

        return $bien;
    }

    public function eliminar(string $id): void
    {
        $bien = $this->repository->findById($id);
        if (!$bien) {
            throw new \DomainException("Bien cultural no encontrado: {$id}");
        }
        $this->repository->delete($id);
    }

    public function buscar(array $filtros, int $page = 1, int $perPage = 15): array
    {
        return $this->repository->buscar(
            query:   $filtros['q'] ?? null,
            tipo:    isset($filtros['tipo']) ? TipoPatrimonio::from($filtros['tipo']) : null,
            region:  $filtros['region'] ?? null,
            periodo: $filtros['periodo'] ?? null,
            estado:  $filtros['estado'] ?? null,
            idioma:  $filtros['idioma'] ?? null,
            page:    $page,
            perPage: $perPage,
        );
    }

    public function obtenerEstadisticas(): array
    {
        return [
            'por_tipo'   => $this->repository->countByTipo(),
            'por_region' => $this->repository->countByRegion(),
            'por_estado' => $this->repository->countByEstado(),
        ];
    }

    public function obtenerCercanos(float $latitud, float $longitud, float $radioKm = 10): array
    {
        return $this->repository->findCercanos($latitud, $longitud, $radioKm);
    }
}
