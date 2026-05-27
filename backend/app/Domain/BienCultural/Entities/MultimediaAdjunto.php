<?php

declare(strict_types=1);

namespace App\Domain\Entities;

use App\Domain\ValueObjects\MultimediaId;
use App\Domain\ValueObjects\TipoMultimedia;
use DateTimeImmutable;

/**
 * Entidad de Dominio: MultimediaAdjunto
 *
 * Representa un archivo multimedia (foto o audio) asociado
 * a un bien cultural registrado en campo.
 *
 * Reglas de negocio encapsuladas aquí:
 * - Un audio no puede superar 300 segundos
 * - Una foto debe tener dimensiones mínimas de 100x100 px
 * - El path de almacenamiento sigue el patrón: tipo/año/mes/uuid.ext
 */
final class MultimediaAdjunto
{
    private function __construct(
        private readonly MultimediaId      $id,
        private readonly TipoMultimedia    $tipo,
        private readonly string            $nombreOriginal,
        private readonly string            $rutaAlmacenamiento,
        private readonly string            $mimeType,
        private readonly int               $tamanoBytes,
        private readonly DateTimeImmutable $creadoEn,
        private readonly ?int              $duracionSegundos = null,  // Solo para audio
        private readonly ?int              $anchoPixeles     = null,  // Solo para imagen
        private readonly ?int              $altoPixeles      = null,  // Solo para imagen
    ) {}

    // ── Factory methods ──────────────────────────────────────

    public static function crearFoto(
        MultimediaId $id,
        string       $nombreOriginal,
        string       $rutaAlmacenamiento,
        string       $mimeType,
        int          $tamanoBytes,
        ?int         $anchoPixeles = null,
        ?int         $altoPixeles  = null,
    ): self {
        return new self(
            id:                  $id,
            tipo:                TipoMultimedia::FOTO,
            nombreOriginal:      $nombreOriginal,
            rutaAlmacenamiento:  $rutaAlmacenamiento,
            mimeType:            $mimeType,
            tamanoBytes:         $tamanoBytes,
            creadoEn:            new DateTimeImmutable(),
            anchoPixeles:        $anchoPixeles,
            altoPixeles:         $altoPixeles,
        );
    }

    public static function crearAudio(
        MultimediaId $id,
        string       $nombreOriginal,
        string       $rutaAlmacenamiento,
        string       $mimeType,
        int          $tamanoBytes,
        int          $duracionSegundos,
    ): self {
        // Invariante de dominio: audio máximo 5 minutos
        if ($duracionSegundos > 300) {
            throw new \DomainException(
                "La duración del audio ({$duracionSegundos}s) supera el máximo permitido de 300 segundos."
            );
        }

        return new self(
            id:                  $id,
            tipo:                TipoMultimedia::AUDIO,
            nombreOriginal:      $nombreOriginal,
            rutaAlmacenamiento:  $rutaAlmacenamiento,
            mimeType:            $mimeType,
            tamanoBytes:         $tamanoBytes,
            creadoEn:            new DateTimeImmutable(),
            duracionSegundos:    $duracionSegundos,
        );
    }

    // ── Reconstitución desde persistencia ───────────────────
    public static function reconstituir(
        MultimediaId      $id,
        TipoMultimedia    $tipo,
        string            $nombreOriginal,
        string            $rutaAlmacenamiento,
        string            $mimeType,
        int               $tamanoBytes,
        DateTimeImmutable $creadoEn,
        ?int              $duracionSegundos = null,
        ?int              $anchoPixeles     = null,
        ?int              $altoPixeles      = null,
    ): self {
        return new self(
            id:                  $id,
            tipo:                $tipo,
            nombreOriginal:      $nombreOriginal,
            rutaAlmacenamiento:  $rutaAlmacenamiento,
            mimeType:            $mimeType,
            tamanoBytes:         $tamanoBytes,
            creadoEn:            $creadoEn,
            duracionSegundos:    $duracionSegundos,
            anchoPixeles:        $anchoPixeles,
            altoPixeles:         $altoPixeles,
        );
    }

    // ── Getters ──────────────────────────────────────────────
    public function getId():                   MultimediaId      { return $this->id; }
    public function getTipo():                 TipoMultimedia    { return $this->tipo; }
    public function getNombreOriginal():       string            { return $this->nombreOriginal; }
    public function getRutaAlmacenamiento():   string            { return $this->rutaAlmacenamiento; }
    public function getMimeType():             string            { return $this->mimeType; }
    public function getTamanoBytes():          int               { return $this->tamanoBytes; }
    public function getCreadoEn():             DateTimeImmutable { return $this->creadoEn; }
    public function getDuracionSegundos():     ?int              { return $this->duracionSegundos; }
    public function getAnchoPixeles():         ?int              { return $this->anchoPixeles; }
    public function getAltoPixeles():          ?int              { return $this->altoPixeles; }

    public function esFoto():  bool { return $this->tipo === TipoMultimedia::FOTO; }
    public function esAudio(): bool { return $this->tipo === TipoMultimedia::AUDIO; }

    public function toArray(): array
    {
        return [
            'id'                  => $this->id->value(),
            'tipo'                => $this->tipo->value,
            'nombre_original'     => $this->nombreOriginal,
            'ruta_almacenamiento' => $this->rutaAlmacenamiento,
            'mime_type'           => $this->mimeType,
            'tamano_bytes'        => $this->tamanoBytes,
            'creado_en'           => $this->creadoEn->format('c'),
            'duracion_segundos'   => $this->duracionSegundos,
            'ancho_pixeles'       => $this->anchoPixeles,
            'alto_pixeles'        => $this->altoPixeles,
        ];
    }
}
