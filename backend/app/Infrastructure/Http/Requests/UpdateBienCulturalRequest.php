<?php

namespace App\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBienCulturalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->rol === 'administrador';
    }

    public function rules(): array
    {
        return [
            'nombre'            => 'required|string|max:200',
            'tipo'              => 'required|in:arqueologico,inmaterial,documental,arquitectonico,natural',
            'descripcion'       => 'required|string|min:20',
            'latitud'           => 'required|numeric|between:-90,90',
            'longitud'          => 'required|numeric|between:-180,180',
            'altitud'           => 'nullable|numeric',
            'estado'            => 'required|in:excelente,bueno,regular,deteriorado,critico',
            'region_geografica' => 'required|string|max:100',
            'periodo_historico' => 'required|string|max:100',
            'idioma'            => 'sometimes|in:es,qu,ay',
            'comunidad_id'      => 'nullable|uuid|exists:comunidades,id',
        ];
    }
}
