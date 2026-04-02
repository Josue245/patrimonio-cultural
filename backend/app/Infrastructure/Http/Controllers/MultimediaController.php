<?php

namespace App\Infrastructure\Http\Controllers;

use App\Application\Ports\Contracts\MultimediaPortInterface;
use App\Infrastructure\Persistence\Eloquent\MultimediaModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MultimediaController extends BaseApiController
{
    public function __construct(private readonly MultimediaPortInterface $storage) {}

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'archivo'          => 'required|file|max:51200', // 50 MB
            'bien_cultural_id' => 'required|uuid|exists:bienes_culturales,id',
            'tipo'             => 'required|in:fotografia,video,audio,documento',
            'descripcion'      => 'nullable|string|max:255',
        ]);

        $archivo   = $request->file('archivo');
        $nombre    = Str::uuid() . '.' . $archivo->getClientOriginalExtension();
        $urlPublica = $this->storage->subir($nombre, file_get_contents($archivo->getRealPath()), $archivo->getMimeType());

        $media = MultimediaModel::create([
            'id'               => Str::uuid(),
            'bien_cultural_id' => $request->bien_cultural_id,
            'tipo'             => $request->tipo,
            'nombre_original'  => $archivo->getClientOriginalName(),
            'ruta_storage'     => 'patrimonio/' . date('Y/m') . '/' . $nombre,
            'url_publica'      => $urlPublica,
            'mime_type'        => $archivo->getMimeType(),
            'tamano_bytes'     => $archivo->getSize(),
            'descripcion'      => $request->descripcion,
            'subido_por'       => $request->user()->id,
        ]);

        return $this->successResponse($media, 'Archivo subido exitosamente.', 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $media = MultimediaModel::findOrFail($id);
        $this->storage->eliminar($media->ruta_storage);
        $media->delete();
        return $this->successResponse(null, 'Archivo eliminado.');
    }
}
