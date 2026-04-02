<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\BienCultural\Entities\BienCultural;
use App\Domain\BienCultural\Repositories\BienCulturalRepositoryInterface;
use App\Domain\BienCultural\ValueObjects\EstadoConservacion;
use App\Domain\BienCultural\ValueObjects\GeoPoint;
use App\Domain\BienCultural\ValueObjects\TipoPatrimonio;
use App\Infrastructure\Persistence\Eloquent\BienCulturalModel;
use Illuminate\Support\Facades\DB;

class EloquentBienCulturalRepository implements BienCulturalRepositoryInterface
{
    public function findById(string $id): ?BienCultural
    {
        $model = BienCulturalModel::find($id);
        return $model ? $this->toDomain($model) : null;
    }

    public function findAll(int $page = 1, int $perPage = 15): array
    {
        $paginator = BienCulturalModel::paginate($perPage, ['*'], 'page', $page);
        return [
            'data'         => array_map([$this, 'toDomain'], $paginator->items()),
            'total'        => $paginator->total(),
            'per_page'     => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
        ];
    }

    public function save(BienCultural $bien): void
    {
        $data = $bien->toArray();
        BienCulturalModel::create([
            'id'               => $data['id'],
            'nombre'           => $data['nombre'],
            'tipo'             => $data['tipo'],
            'descripcion'      => $data['descripcion'],
            'latitud'          => $data['coordenadas']['latitud'],
            'longitud'         => $data['coordenadas']['longitud'],
            'altitud'          => $data['coordenadas']['altitud'],
            'coordenadas'      => DB::raw("ST_GeomFromText('" . $bien->getCoordenadas()->toWKT() . "', 4326)"),
            'estado'           => $data['estado'],
            'region_geografica'=> $data['region_geografica'],
            'periodo_historico'=> $data['periodo_historico'],
            'idioma'           => $data['idioma'],
            'comunidad_id'     => $data['comunidad_id'],
        ]);
    }

    public function update(BienCultural $bien): void
    {
        $data = $bien->toArray();
        BienCulturalModel::where('id', $bien->getId())->update([
            'nombre'           => $data['nombre'],
            'descripcion'      => $data['descripcion'],
            'estado'           => $data['estado'],
            'periodo_historico'=> $data['periodo_historico'],
        ]);
    }

    public function delete(string $id): void
    {
        BienCulturalModel::destroy($id);
    }

    public function existeDuplicado(string $nombre, string $region, ?string $excludeId = null): bool
    {
        $query = BienCulturalModel::where('nombre', $nombre)
            ->where('region_geografica', $region);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return $query->exists();
    }

    public function buscar(
        ?string $query = null,
        ?TipoPatrimonio $tipo = null,
        ?string $region = null,
        ?string $periodo = null,
        ?string $estado = null,
        ?string $idioma = null,
        int $page = 1,
        int $perPage = 15,
    ): array {
        $q = BienCulturalModel::query();

        if ($query) {
            $q->where(function ($sub) use ($query) {
                $sub->where('nombre', 'ilike', "%{$query}%")
                    ->orWhere('descripcion', 'ilike', "%{$query}%");
            });
        }
        if ($tipo)    $q->where('tipo', $tipo->value);
        if ($region)  $q->where('region_geografica', 'ilike', "%{$region}%");
        if ($periodo) $q->where('periodo_historico', 'ilike', "%{$periodo}%");
        if ($estado)  $q->where('estado', $estado);
        if ($idioma)  $q->where('idioma', $idioma);

        $paginator = $q->paginate($perPage, ['*'], 'page', $page);

        return [
            'data'         => array_map([$this, 'toDomain'], $paginator->items()),
            'total'        => $paginator->total(),
            'per_page'     => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
        ];
    }

    public function findCercanos(float $latitud, float $longitud, float $radioKm = 10): array
    {
        $models = BienCulturalModel::selectRaw("*, ST_Distance(coordenadas::geography, ST_MakePoint(?, ?)::geography) / 1000 AS distancia_km", [$longitud, $latitud])
            ->whereRaw("ST_DWithin(coordenadas::geography, ST_MakePoint(?, ?)::geography, ?)", [$longitud, $latitud, $radioKm * 1000])
            ->orderBy('distancia_km')
            ->get();

        return $models->map([$this, 'toDomain'])->toArray();
    }

    public function countByTipo(): array
    {
        return BienCulturalModel::selectRaw('tipo, count(*) as total')
            ->groupBy('tipo')->get()->toArray();
    }

    public function countByRegion(): array
    {
        return BienCulturalModel::selectRaw('region_geografica, count(*) as total')
            ->groupBy('region_geografica')->orderByDesc('total')->get()->toArray();
    }

    public function countByEstado(): array
    {
        return BienCulturalModel::selectRaw('estado, count(*) as total')
            ->groupBy('estado')->get()->toArray();
    }

    private function toDomain(BienCulturalModel $model): BienCultural
    {
        return new BienCultural(
            id:               $model->id,
            nombre:           $model->nombre,
            tipo:             TipoPatrimonio::from($model->tipo),
            descripcion:      $model->descripcion,
            coordenadas:      new GeoPoint($model->latitud, $model->longitud, $model->altitud),
            estado:           EstadoConservacion::from($model->estado),
            regionGeografica: $model->region_geografica,
            periodoHistorico: $model->periodo_historico,
            idioma:           $model->idioma,
            comunidadId:      $model->comunidad_id,
        );
    }
}
