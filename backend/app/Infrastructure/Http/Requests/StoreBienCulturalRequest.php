<?php

namespace App\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBienCulturalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && in_array($this->user()->rol, ['administrador']);
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

    public function messages(): array
    {
        return [
            'nombre.required'            => 'El nombre del bien cultural es obligatorio.',
            'tipo.required'              => 'Debe especificar el tipo de patrimonio.',
            'tipo.in'                    => 'Tipo inválido. Opciones: arqueologico, inmaterial, documental, arquitectonico, natural.',
            'descripcion.min'            => 'La descripción debe tener al menos 20 caracteres.',
            'latitud.between'            => 'La latitud debe estar entre -90 y 90.',
            'longitud.between'           => 'La longitud debe estar entre -180 y 180.',
            'estado.in'                  => 'Estado inválido. Opciones: excelente, bueno, regular, deteriorado, critico.',
            'region_geografica.required' => 'La región geográfica es obligatoria.',
        ];
    }
}
