<?php

declare(strict_types=1);

namespace App\Application\DTOs;

use Illuminate\Http\UploadedFile;

/**
 * DTO: RegistroMovilDTO
 *
 * Transporta los datos crudos de un registro móvil desde la capa
 * Infrastructure (HTTP) hacia la capa Application (Use Case).
 *
 * No contiene lógica; es un objeto de datos inmutable.
 */
final class RegistroMovilDTO
{
    /**
     * @param UploadedFile[] $fotos
     * @param UploadedFile[] $audios
     * @param int[]          $audiosDuracion  segundos por audio (mismo índice)
     */
    public function __construct(
        // Identificación del bien
        public readonly string  $nombre,
        public readonly string  $tipo,
        public readonly string  $estadoConservacion,
        public readonly ?string $descripcion = null,

        // Ubicación GPS (capturada automáticamente por el móvil)
        public readonly float   $latitud,
        public readonly float   $longitud,
        public readonly ?float  $altitud       = null,
        public readonly ?int    $precisionGps  = null,

        // Ubicación administrativa
        public readonly ?string $comunidad     = null,
        public readonly ?string $distrito      = null,
        public readonly ?string $provincia     = null,
        public readonly ?string $observaciones = null,

        // Multimedia adjunta
        public readonly array   $fotos         = [],
        public readonly array   $audios        = [],
        public readonly array   $audiosDuracion= [],

        // Metadatos del registro
        public readonly bool    $origenMovil   = true,
        public readonly ?string $gestorId      = null,
    ) {}

    public static function fromRequest(\Illuminate\Http\Request $request, string $gestorId): self
    {
        return new self(
            nombre:            $request->input('nombre'),
            tipo:              $request->input('tipo'),
            estadoConservacion:$request->input('estado_conservacion'),
            descripcion:       $request->input('descripcion', ''),
            latitud:           (float) $request->input('latitud'),
            longitud:          (float) $request->input('longitud'),
            altitud:           $request->input('altitud') !== null
                                 ? (float) $request->input('altitud')
                                 : null,
            precisionGps:      $request->input('precision_gps') !== null
                                 ? (int) $request->input('precision_gps')
                                 : null,
            comunidad:         $request->input('comunidad'),
            distrito:          $request->input('distrito'),
            provincia:         $request->input('provincia'),
            observaciones:     $request->input('observaciones'),
            fotos:             $request->file('fotos', []),
            audios:            $request->file('audios', []),
            audiosDuracion:    array_map('intval', $request->input('audios_duracion', [])),
            origenMovil:       (bool) $request->input('origen_movil', true),
            gestorId:          $gestorId,
        );
    }
}
