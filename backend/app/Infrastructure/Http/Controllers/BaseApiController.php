<?php

namespace App\Infrastructure\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\JsonResponse;

abstract class BaseApiController extends Controller
{
    protected function successResponse(mixed $data, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    protected function errorResponse(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $status);
    }

    protected function paginatedResponse(array $paginator): JsonResponse
{
    $data = array_map(function ($item) {
        if (is_object($item) && method_exists($item, 'toArray')) {
            return $item->toArray();
        }
        return $item;
    }, $paginator['data']);

    return response()->json([
        'success' => true,
        'data'    => $data,
        'meta'    => [
            'total'        => $paginator['total'],
            'per_page'     => $paginator['per_page'],
            'current_page' => $paginator['current_page'],
            'last_page'    => $paginator['last_page'],
        ],
    ]);
}
}
