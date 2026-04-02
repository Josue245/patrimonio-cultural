<?php

namespace App\Infrastructure\Http\Controllers;

use App\Application\DTOs\BienCulturalDTO;
use App\Application\Services\GestionPatrimonioService;
use App\Infrastructure\Http\Requests\StoreBienCulturalRequest;
use App\Infrastructure\Http\Requests\UpdateBienCulturalRequest;
use App\Infrastructure\Http\Requests\BusquedaAvanzadaRequest;
use App\Infrastructure\Http\Resources\BienCulturalResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BienCulturalController extends BaseApiController
{
    public function __construct(
    private readonly GestionPatrimonioService $service,
    private readonly \App\Domain\BienCultural\Repositories\BienCulturalRepositoryInterface $repository,
) {}

    /**
     * @OA\Get(
     *     path="/v1/bienes-culturales",
     *     tags={"Bienes Culturales"},
     *     summary="Listar bienes culturales (paginado)",
     *     @OA\Parameter(name="q",        in="query", description="Texto libre"),
     *     @OA\Parameter(name="tipo",     in="query", description="arqueologico|inmaterial|documental|arquitectonico|natural"),
     *     @OA\Parameter(name="region",   in="query", description="Region geografica"),
     *     @OA\Parameter(name="estado",   in="query", description="excelente|bueno|regular|deteriorado|critico"),
     *     @OA\Parameter(name="page",     in="query", description="Numero de pagina"),
     *     @OA\Parameter(name="per_page", in="query", description="Resultados por pagina"),
     *     @OA\Response(response=200, description="Lista paginada")
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $resultado = $this->service->buscar(
            filtros: $request->only(['q','tipo','region','periodo','estado','idioma']),
            page:    (int) $request->get('page', 1),
            perPage: (int) $request->get('per_page', 15),
        );
        return $this->paginatedResponse($resultado);
    }

    /**
     * @OA\Post(
     *     path="/v1/bienes-culturales",
     *     tags={"Bienes Culturales"},
     *     summary="Registrar nuevo bien cultural",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","tipo","descripcion","latitud","longitud","estado","region_geografica","periodo_historico"},
     *             @OA\Property(property="nombre",            type="string",  example="Zona Arqueologica de Huari Vilca"),
     *             @OA\Property(property="tipo",              type="string",  enum={"arqueologico","inmaterial","documental","arquitectonico","natural"}),
     *             @OA\Property(property="descripcion",       type="string",  example="Complejo arqueologico Wari..."),
     *             @OA\Property(property="latitud",           type="number",  format="float", example=-12.0623),
     *             @OA\Property(property="longitud",          type="number",  format="float", example=-75.2053),
     *             @OA\Property(property="altitud",           type="number",  format="float", example=3271.0),
     *             @OA\Property(property="estado",            type="string",  enum={"excelente","bueno","regular","deteriorado","critico"}),
     *             @OA\Property(property="region_geografica", type="string",  example="Huancayo"),
     *             @OA\Property(property="periodo_historico", type="string",  example="Horizonte Medio (600-1000 d.C.)"),
     *             @OA\Property(property="idioma",            type="string",  enum={"es","qu","ay"}, example="es")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Bien registrado"),
     *     @OA\Response(response=401, description="No autenticado"),
     *     @OA\Response(response=403, description="Sin permisos de administrador"),
     *     @OA\Response(response=422, description="Error de validacion o duplicado")
     * )
     */
    public function store(StoreBienCulturalRequest $request): JsonResponse
    {
        try {
            $dto  = BienCulturalDTO::fromArray($request->validated());
            $bien = $this->service->registrar($dto);
            return $this->successResponse(new BienCulturalResource($bien), 'Bien cultural registrado.', 201);
        } catch (\DomainException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * @OA\Get(
     *     path="/v1/bienes-culturales/{id}",
     *     tags={"Bienes Culturales"},
     *     summary="Detalle de un bien cultural",
     *     @OA\Parameter(name="id", in="path", required=true, description="UUID del bien cultural", @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Detalle del bien"),
     *     @OA\Response(response=404, description="No encontrado")
     * )
     */
   public function show(string $id): JsonResponse
{
    $bien = $this->repository->findById($id);
    if (!$bien) {
        return $this->errorResponse('Bien cultural no encontrado.', 404);
    }
    return $this->successResponse(new BienCulturalResource($bien));
}

    /**
     * @OA\Put(
     *     path="/v1/bienes-culturales/{id}",
     *     tags={"Bienes Culturales"},
     *     summary="Actualizar bien cultural",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Bien actualizado"),
     *     @OA\Response(response=401, description="No autenticado"),
     *     @OA\Response(response=403, description="Sin permisos")
     * )
     */
    public function update(UpdateBienCulturalRequest $request, string $id): JsonResponse
    {
        try {
            $dto  = BienCulturalDTO::fromArray($request->validated());
            $bien = $this->service->actualizar($id, $dto);
            return $this->successResponse(new BienCulturalResource($bien), 'Bien actualizado.');
        } catch (\DomainException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * @OA\Delete(
     *     path="/v1/bienes-culturales/{id}",
     *     tags={"Bienes Culturales"},
     *     summary="Eliminar bien cultural",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string", format="uuid")),
     *     @OA\Response(response=200, description="Bien eliminado"),
     *     @OA\Response(response=401, description="No autenticado"),
     *     @OA\Response(response=403, description="Sin permisos")
     * )
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->service->eliminar($id);
            return $this->successResponse(null, 'Bien cultural eliminado.');
        } catch (\DomainException $e) {
            return $this->errorResponse($e->getMessage(), 404);
        }
    }

    /**
     * @OA\Get(
     *     path="/v1/busqueda",
     *     tags={"Bienes Culturales"},
     *     summary="Busqueda avanzada con filtros combinados",
     *     @OA\Parameter(name="q",       in="query", description="Texto libre"),
     *     @OA\Parameter(name="tipo",    in="query"),
     *     @OA\Parameter(name="region",  in="query"),
     *     @OA\Parameter(name="periodo", in="query"),
     *     @OA\Parameter(name="estado",  in="query"),
     *     @OA\Parameter(name="idioma",  in="query", description="es|qu|ay"),
     *     @OA\Response(response=200, description="Resultados de busqueda")
     * )
     */
    public function busquedaAvanzada(BusquedaAvanzadaRequest $request): JsonResponse
    {
        $resultado = $this->service->buscar(
            filtros: $request->validated(),
            page:    (int) $request->get('page', 1),
            perPage: (int) $request->get('per_page', 15),
        );
        return $this->paginatedResponse($resultado);
    }

    /**
     * @OA\Get(
     *     path="/v1/mapa/bienes",
     *     tags={"Mapa"},
     *     summary="Bienes culturales cercanos a una coordenada",
     *     @OA\Parameter(name="latitud",  in="query", required=true,  @OA\Schema(type="number", format="float"), example=-12.0621),
     *     @OA\Parameter(name="longitud", in="query", required=true,  @OA\Schema(type="number", format="float"), example=-75.2049),
     *     @OA\Parameter(name="radio_km", in="query", required=false, @OA\Schema(type="integer"), example=10),
     *     @OA\Response(response=200, description="Lista de bienes cercanos")
     * )
     */
    public function cercanos(Request $request): JsonResponse
    {
        $request->validate([
            'latitud'  => 'required|numeric|between:-90,90',
            'longitud' => 'required|numeric|between:-180,180',
            'radio_km' => 'sometimes|numeric|min:1|max:100',
        ]);

        $bienes = $this->service->obtenerCercanos(
            latitud:  (float) $request->latitud,
            longitud: (float) $request->longitud,
            radioKm:  (float) $request->get('radio_km', 10),
        );

        return $this->successResponse(BienCulturalResource::collection($bienes));
    }

    public function estadisticas(): JsonResponse
    {
        return $this->successResponse($this->service->obtenerEstadisticas());
    }

    public function exportarFicha(string $id): JsonResponse
    {
        return $this->successResponse(['id' => $id, 'mensaje' => 'Ficha PDF pendiente de implementacion.']);
    }
}
