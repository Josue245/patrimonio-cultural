<?php

namespace App\Infrastructure\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleCheckMiddleware
{
    /**
     * Uso en rutas: middleware('role:administrador')
     *              middleware('role:investigador,administrador')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        if (!in_array($user->rol, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para esta acción.',
                'rol_requerido' => $roles,
                'tu_rol'        => $user->rol,
            ], 403);
        }

        return $next($request);
    }
}
