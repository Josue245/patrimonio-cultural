<?php

namespace App\Infrastructure\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Infrastructure\Persistence\Eloquent\UserModel;

/**
 * @OA\Info(
 *     title="Patrimonio Cultural Digital Andino API",
 *     version="1.0.0",
 *     description="API REST para la Plataforma Inteligente de Gestión del Patrimonio Cultural Digital Andino - Región Junín, Perú",
 *     @OA\Contact(email="admin@patrimoniojunin.gob.pe")
 * )
 *
 * @OA\Server(url="/api", description="API Server")
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Ingresa el token JWT obtenido desde POST /api/v1/auth/login. Formato: Bearer {token}"
 * )
 *
 * @OA\Tag(name="Autenticacion", description="Login, registro y gestion de sesion")
 * @OA\Tag(name="Bienes Culturales", description="CRUD de bienes del patrimonio cultural")
 * @OA\Tag(name="Mapa", description="Endpoints de georreferenciacion")
 * @OA\Tag(name="IA", description="Inteligencia Artificial con Groq")
 */
class AuthController extends BaseApiController
{
    /**
     * @OA\Post(
     *     path="/v1/auth/login",
     *     tags={"Autenticacion"},
     *     summary="Iniciar sesion y obtener JWT",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email",    type="string", format="email", example="admin@patrimoniojunin.gob.pe"),
     *             @OA\Property(property="password", type="string", example="Admin2024!")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login exitoso",
     *         @OA\JsonContent(
     *             @OA\Property(property="success",      type="boolean", example=true),
     *             @OA\Property(property="access_token", type="string",  example="eyJhbGciOiJIUzI1NiJ9..."),
     *             @OA\Property(property="token_type",   type="string",  example="bearer"),
     *             @OA\Property(property="expires_in",   type="integer", example=86400)
     *         )
     *     ),
     *     @OA\Response(response=401, description="Credenciales incorrectas")
     * )
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if (!$token = Auth::guard('api')->attempt($request->only('email', 'password'))) {
            return $this->errorResponse('Credenciales incorrectas.', 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * @OA\Post(
     *     path="/v1/auth/register",
     *     tags={"Autenticacion"},
     *     summary="Registrar nuevo usuario",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","email","password","password_confirmation"},
     *             @OA\Property(property="nombre",                type="string",  example="Juan Quispe"),
     *             @OA\Property(property="email",                 type="string",  format="email", example="juan@ejemplo.com"),
     *             @OA\Property(property="password",              type="string",  example="Password123!"),
     *             @OA\Property(property="password_confirmation", type="string",  example="Password123!"),
     *             @OA\Property(property="rol", type="string", enum={"visitante","investigador"}, example="visitante")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Usuario creado"),
     *     @OA\Response(response=422, description="Error de validacion")
     * )
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'nombre'   => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'rol'      => 'sometimes|in:visitante,investigador',
        ]);

        $user  = UserModel::create([
            'name'     => $request->nombre,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'rol'      => $request->get('rol', 'visitante'),
        ]);

        $token = Auth::guard('api')->login($user);
        return $this->respondWithToken($token, 201);
    }

    /**
     * @OA\Get(
     *     path="/v1/auth/me",
     *     tags={"Autenticacion"},
     *     summary="Datos del usuario autenticado",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Datos del usuario"),
     *     @OA\Response(response=401, description="No autenticado")
     * )
     */
    public function me(): JsonResponse
    {
        return $this->successResponse(Auth::guard('api')->user());
    }

    /**
     * @OA\Post(
     *     path="/v1/auth/logout",
     *     tags={"Autenticacion"},
     *     summary="Cerrar sesion",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Sesion cerrada")
     * )
     */
    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();
        return $this->successResponse(null, 'Sesion cerrada.');
    }

    /**
     * @OA\Post(
     *     path="/v1/auth/refresh",
     *     tags={"Autenticacion"},
     *     summary="Renovar token JWT",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Token renovado")
     * )
     */
    public function refresh(): JsonResponse
    {
        return $this->respondWithToken(Auth::guard('api')->refresh());
    }

    private function respondWithToken(string $token, int $status = 200): JsonResponse
    {
        return response()->json([
            'success'      => true,
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => Auth::guard('api')->factory()->getTTL() * 60,
            'user'         => Auth::guard('api')->user(),
        ], $status);
    }
}
