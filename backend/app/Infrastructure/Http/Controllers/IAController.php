<?php

namespace App\Infrastructure\Http\Controllers;

use App\Infrastructure\External\IA\DjangoMLAdapter;
use App\Infrastructure\Persistence\Repositories\EloquentBienCulturalRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IAController extends BaseApiController
{
    public function __construct(
        private readonly DjangoMLAdapter $ml,
    ) {}

    /**
     * POST /api/v1/ia/clasificar
     * Clasifica el tipo de patrimonio de un bien dado nombre + descripción.
     */
    public function clasificar(Request $request): JsonResponse
    {
        $request->validate([
            'nombre'      => 'required_without:descripcion|string|max:300',
            'descripcion' => 'required_without:nombre|string',
        ]);

        $resultado = $this->ml->clasificar(
            $request->get('nombre', ''),
            $request->get('descripcion', '')
        );

        return $this->successResponse($resultado['data'] ?? $resultado);
    }

    /**
     * POST /api/v1/ia/analizar
     * Análisis profundo de un bien cultural existente.
     */
    public function analizar(Request $request): JsonResponse
    {
        $request->validate([
            'bien_id' => 'sometimes|uuid',
            'bien'    => 'sometimes|array',
        ]);

        // Si viene un bien_id, cargarlo desde la BD
        if ($request->has('bien_id')) {
            $repo = app(EloquentBienCulturalRepository::class);
            $bien = $repo->findById($request->bien_id);
            if (!$bien) {
                return $this->errorResponse('Bien cultural no encontrado.', 404);
            }
            $bienData = $bien->toArray();
        } else {
            $bienData = $request->get('bien', []);
        }

        $resultado = $this->ml->analizar($bienData);
        return $this->successResponse($resultado);
    }

    /**
     * POST /api/v1/ia/similar
     * Búsqueda semántica con IA en el catálogo.
     */
    public function similar(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:3|max:500',
            'top_k' => 'sometimes|integer|min:1|max:20',
        ]);

        $repo   = app(EloquentBienCulturalRepository::class);
        $todos  = $repo->findAll(1, 200);
        $bienes = array_map(fn($b) => $b->toArray(), $todos['data']);

        $resultado = $this->ml->buscarSimilares(
            $request->input('query'),
            $bienes,
            $request->get('top_k', 5)
        );

        return $this->successResponse($resultado);
    }

    /**
     * POST /api/v1/ia/detectar-duplicado
     * Detecta si un bien nuevo es duplicado antes de guardarlo.
     */
    public function detectarDuplicado(Request $request): JsonResponse
    {
        $request->validate([
            'nombre'            => 'required|string',
            'descripcion'       => 'sometimes|string',
            'region_geografica' => 'sometimes|string',
        ]);

        $nuevo = $request->only(['nombre', 'descripcion', 'region_geografica']);

        // Obtener existentes de la BD (limitado para no sobrecargar Groq)
        $repo       = app(EloquentBienCulturalRepository::class);
        $todos      = $repo->findAll(1, 10);
        $existentes = array_map(fn($b) => $b->toArray(), $todos['data']);

        $resultado = $this->ml->detectarDuplicados($nuevo, $existentes);
        return $this->successResponse($resultado);
    }

    /**
     * POST /api/v1/ia/generar-descripcion
     * Genera una descripción enriquecida con Groq.
     */
    public function generarDescripcion(Request $request): JsonResponse
    {
        $request->validate([
            'nombre'            => 'required|string',
            'tipo'              => 'sometimes|string',
            'region_geografica' => 'sometimes|string',
            'periodo_historico' => 'sometimes|string',
        ]);

        $resultado = $this->ml->generarDescripcion($request->all());
        return $this->successResponse($resultado);
    }

    /**
     * GET /api/v1/ia/estado
     * Estado del servicio de IA.
     */
    public function estado(): JsonResponse
    {
        $activo = $this->ml->healthCheck();
        $stats  = $activo ? $this->ml->estadisticas() : [];

        return $this->successResponse([
            'servicio_activo' => $activo,
            'estadisticas'    => $stats,
        ]);
    }
}