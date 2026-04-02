<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (TokenExpiredException $e) {
            return response()->json(['success' => false, 'message' => 'Token expirado.'], 401);
        });

        $this->renderable(function (TokenInvalidException $e) {
            return response()->json(['success' => false, 'message' => 'Token inválido.'], 401);
        });

        $this->renderable(function (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token requerido.'], 401);
        });
    }

    protected function unauthenticated($request, AuthenticationException $exception): mixed
    {
        return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
    }

    protected function invalidJson($request, ValidationException $exception): mixed
    {
        return response()->json([
            'success' => false,
            'message' => 'Error de validación.',
            'errors'  => $exception->errors(),
        ], 422);
    }
}
