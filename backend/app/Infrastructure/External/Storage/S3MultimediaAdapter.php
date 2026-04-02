<?php

namespace App\Infrastructure\External\Storage;

use App\Application\Ports\Contracts\MultimediaPortInterface;
use Illuminate\Support\Facades\Storage;

class S3MultimediaAdapter implements MultimediaPortInterface
{
    public function subir(string $nombreArchivo, mixed $contenido, string $mimeType): string
    {
        $ruta = 'patrimonio/' . date('Y/m') . '/' . $nombreArchivo;
        Storage::disk('s3')->put($ruta, $contenido, [
            'ContentType' => $mimeType,
            'ACL'         => 'public-read',
        ]);
        return Storage::disk('s3')->url($ruta);
    }

    public function obtenerURL(string $ruta, int $minutosExpiracion = 60): string
    {
        return Storage::disk('s3')->temporaryUrl($ruta, now()->addMinutes($minutosExpiracion));
    }

    public function eliminar(string $ruta): bool
    {
        return Storage::disk('s3')->delete($ruta);
    }
}
