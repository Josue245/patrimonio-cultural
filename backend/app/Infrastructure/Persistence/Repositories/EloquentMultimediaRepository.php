<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent;

use App\Application\Ports\Out\MultimediaRepositoryPort;
use App\Domain\Entities\MultimediaAdjunto;
use App\Domain\ValueObjects\MultimediaId;
use App\Domain\ValueObjects\TipoMultimedia;
use App\Infrastructure\Models\MultimediaAdjuntoModel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Adaptador: EloquentMultimediaRepository
 *
 * Implementación concreta del puerto MultimediaRepositoryPort.
 * Usa Laravel Storage (disco 'bienes_culturales') y Eloquent.
 *
 * La Application no sabe que existe Eloquent ni S3.
 */
final class EloquentMultimediaRepository implements MultimediaRepositoryPort
{
    // Disco configurado en config/filesystems.php
    private const DISCO = 'bienes_culturales';

    // Tipos MIME aceptados
    private const MIMES_FOTO  = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    private const MIMES_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];

    public function almacenarArchivo(
        UploadedFile $archivo,
        string       $bienCulturalId,
        ?int         $duracionSeg = null,
    ): MultimediaAdjunto {
        $mimeType = $archivo->getMimeType() ?? '';
        $tipo     = TipoMultimedia::fromMimeType($mimeType);

        $this->validarMimeType($mimeType, $tipo);

        $id   = MultimediaId::generar();
        $ext  = $this->extensionSegura($archivo, $tipo);
        $ruta = $this->construirRuta($tipo, $bienCulturalId, $id->value(), $ext);

        // Almacena el archivo en el disco configurado
        Storage::disk(self::DISCO)->putFileAs(
            dirname($ruta),
            $archivo,
            basename($ruta),
        );

        if ($tipo === TipoMultimedia::FOTO) {
            [$ancho, $alto] = $this->obtenerDimensiones($archivo);
            return MultimediaAdjunto::crearFoto(
                id:                  $id,
                nombreOriginal:      $archivo->getClientOriginalName(),
                rutaAlmacenamiento:  $ruta,
                mimeType:            $mimeType,
                tamanoBytes:         $archivo->getSize(),
                anchoPixeles:        $ancho,
                altoPixeles:         $alto,
            );
        }

        return MultimediaAdjunto::crearAudio(
            id:               $id,
            nombreOriginal:   $archivo->getClientOriginalName(),
            rutaAlmacenamiento: $ruta,
            mimeType:         $mimeType,
            tamanoBytes:      $archivo->getSize(),
            duracionSegundos: $duracionSeg ?? 0,
        );
    }

    public function guardar(MultimediaAdjunto $adjunto, string $bienCulturalId): void
    {
        MultimediaAdjuntoModel::create([
            'id'                   => $adjunto->getId()->value(),
            'bien_cultural_id'     => $bienCulturalId,
            'tipo'                 => $adjunto->getTipo()->value,
            'nombre_original'      => $adjunto->getNombreOriginal(),
            'ruta_almacenamiento'  => $adjunto->getRutaAlmacenamiento(),
            'mime_type'            => $adjunto->getMimeType(),
            'tamano_bytes'         => $adjunto->getTamanoBytes(),
            'duracion_segundos'    => $adjunto->getDuracionSegundos(),
            'ancho_pixeles'        => $adjunto->getAnchoPixeles(),
            'alto_pixeles'         => $adjunto->getAltoPixeles(),
            'creado_en'            => $adjunto->getCreadoEn(),
        ]);
    }

    public function findByBienCulturalId(string $bienCulturalId): array
    {
        return MultimediaAdjuntoModel::where('bien_cultural_id', $bienCulturalId)
            ->orderBy('creado_en')
            ->get()
            ->map(fn($m) => MultimediaAdjunto::reconstituir(
                id:                  MultimediaId::desde($m->id),
                tipo:                TipoMultimedia::from($m->tipo),
                nombreOriginal:      $m->nombre_original,
                rutaAlmacenamiento:  $m->ruta_almacenamiento,
                mimeType:            $m->mime_type,
                tamanoBytes:         $m->tamano_bytes,
                creadoEn:            new \DateTimeImmutable($m->creado_en),
                duracionSegundos:    $m->duracion_segundos,
                anchoPixeles:        $m->ancho_pixeles,
                altoPixeles:         $m->alto_pixeles,
            ))
            ->all();
    }

    public function eliminar(string $multimediaId): void
    {
        $modelo = MultimediaAdjuntoModel::findOrFail($multimediaId);
        Storage::disk(self::DISCO)->delete($modelo->ruta_almacenamiento);
        $modelo->delete();
    }

    // ── Helpers privados ─────────────────────────────────────

    private function validarMimeType(string $mimeType, TipoMultimedia $tipo): void
    {
        $aceptados = $tipo === TipoMultimedia::FOTO ? self::MIMES_FOTO : self::MIMES_AUDIO;
        if (! in_array($mimeType, $aceptados, true)) {
            throw new \DomainException("Tipo MIME no permitido: {$mimeType}");
        }
    }

    private function extensionSegura(UploadedFile $archivo, TipoMultimedia $tipo): string
    {
        $ext = $archivo->getClientOriginalExtension();
        // Fallback seguros por tipo
        if (! $ext) {
            return $tipo === TipoMultimedia::FOTO ? 'jpg' : 'webm';
        }
        return strtolower($ext);
    }

    /**
     * Patrón: tipo/año/mes/bien_id/uuid.ext
     * Ejemplo: foto/2025/06/abc123/uuid.jpg
     */
    private function construirRuta(TipoMultimedia $tipo, string $bienId, string $uuid, string $ext): string
    {
        $year  = date('Y');
        $month = date('m');
        return "{$tipo->value}/{$year}/{$month}/{$bienId}/{$uuid}.{$ext}";
    }

    private function obtenerDimensiones(UploadedFile $archivo): array
    {
        try {
            [$ancho, $alto] = getimagesize($archivo->getRealPath());
            return [$ancho, $alto];
        } catch (\Throwable) {
            return [null, null];
        }
    }
}
