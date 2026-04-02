<?php

namespace App\Application\Ports\Contracts;

interface MultimediaPortInterface
{
    /**
     * Sube un archivo y retorna la URL pública.
     *
     * @param resource|string $contenido
     */
    public function subir(string $nombreArchivo, mixed $contenido, string $mimeType): string;

    /**
     * Obtiene la URL firmada temporal de un recurso.
     */
    public function obtenerURL(string $ruta, int $minutosExpiracion = 60): string;

    /**
     * Elimina un archivo del almacenamiento.
     */
    public function eliminar(string $ruta): bool;
}
