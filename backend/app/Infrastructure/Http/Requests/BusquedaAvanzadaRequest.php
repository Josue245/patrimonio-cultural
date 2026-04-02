<?php

namespace App\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BusquedaAvanzadaRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'q'        => 'nullable|string|max:200',
            'tipo'     => 'nullable|in:arqueologico,inmaterial,documental,arquitectonico,natural',
            'region'   => 'nullable|string|max:100',
            'periodo'  => 'nullable|string|max:100',
            'estado'   => 'nullable|in:excelente,bueno,regular,deteriorado,critico',
            'idioma'   => 'nullable|in:es,qu,ay',
            'page'     => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:5|max:100',
        ];
    }
}
