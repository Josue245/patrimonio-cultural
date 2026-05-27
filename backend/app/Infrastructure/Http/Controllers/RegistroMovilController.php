<?php

declare(strict_types=1);

namespace App\Infrastructure\Http\Controllers;

use App\Application\DTOs\RegistroMovilDTO;
use App\Application\Ports\Contracts\RegistrarBienMovilPortInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

final class RegistroMovilController extends Controller
{
    public function __construct(
        private readonly RegistrarBienMovilPortInterface $registrarBienMovil,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre'              => ['required', 'string', 'max:200'],
            'tipo'                => ['required', 'string', 'in:arquitectonico,arqueologico,natural,documental,inmaterial'],
            'estado_conservacion' => ['required', 'string', 'in:excelente,bueno,regular,deteriorado,critico'],
            'descripcion'         => ['nullable', 'string', 'max:2000'],
            'latitud'             => ['required', 'numeric', 'between:-90,90'],
            'longitud'            => ['required', 'numeric', 'between:-180,180'],
            'altitud'             => ['nullable', 'numeric'],
            'precision_gps'       => ['nullable', 'integer', 'min:0', 'max:9999'],
            'comunidad'           => ['nullable', 'string', 'max:150'],
            'distrito'            => ['nullable', 'string', 'max:100'],
            'provincia'           => ['nullable', 'string', 'max:100'],
            'observaciones'       => ['nullable', 'string', 'max:1000'],
            'fotos'               => ['nullable', 'array', 'max:5'],
            'fotos.*'             => ['file', 'mimes:jpg,jpeg,png,webp,heic', 'max:10240'],
            'audios'              => ['nullable', 'array', 'max:3'],
            'audios.*'            => ['file', 'mimes:webm,ogg,mp4,mpeg,wav', 'max:20480'],
            'audios_duracion'     => ['nullable', 'array'],
            'audios_duracion.*'   => ['integer', 'min:1', 'max:300'],
        ]);

        \Log::info('[RegistroMovil] Request data', $request->all());

        if ($validator->fails()) {
    \Log::error('[RegistroMovil] Validación fallida', $validator->errors()->toArray());
    return response()->json([
        'message' => 'Datos de registro inválidos.',
        'errors'  => $validator->errors(),
    ], 422);
}

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de registro inválidos.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $dto       = RegistroMovilDTO::fromRequest($request, $request->user()->id);
            $resultado = $this->registrarBienMovil->ejecutar($dto);

            return response()->json($resultado, 201);

        } catch (\DomainException $e) {
            return response()->json([
                'message' => 'Error de validación geográfica.',
                'error'   => $e->getMessage(),
            ], 422);

        } catch (\DomainException $e) {
    \Log::error('[RegistroMovil] DomainException', ['msg' => $e->getMessage()]);
    return response()->json([
        'message' => 'Error de validación geográfica.',
        'error'   => $e->getMessage(),
    ], 422);


        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Error interno al procesar el registro.',
                'error'   => app()->environment('local') ? $e->getMessage() : 'Error interno del servidor.',
            ], 500);
        }
    }
}