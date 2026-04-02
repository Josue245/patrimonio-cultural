<?php

namespace App\Infrastructure\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BienCulturalResource extends JsonResource
{
    public function toArray($request): array
    {
        // Acepta tanto el domain entity como el array
        if (is_array($this->resource)) {
            return $this->resource;
        }

        $data = $this->resource->toArray();

        return [
            'id'                => $data['id'],
            'nombre'            => $data['nombre'],
            'tipo'              => [
                'codigo' => $data['tipo'],
                'label'  => \App\Domain\BienCultural\ValueObjects\TipoPatrimonio::from($data['tipo'])->label(),
            ],
            'descripcion'       => $data['descripcion'],
            'ubicacion'         => [
                'latitud'  => $data['coordenadas']['latitud'],
                'longitud' => $data['coordenadas']['longitud'],
                'altitud'  => $data['coordenadas']['altitud'],
            ],
            'estado'            => [
                'codigo' => $data['estado'],
                'label'  => \App\Domain\BienCultural\ValueObjects\EstadoConservacion::from($data['estado'])->label(),
            ],
            'region_geografica' => $data['region_geografica'],
            'periodo_historico' => $data['periodo_historico'],
            'idioma'            => $data['idioma'],
            'comunidad_id'      => $data['comunidad_id'],
            'creado_en'         => $data['creado_en'],
        ];
    }
}
