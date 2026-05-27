<?php
// ═════════════════════════════════════════════════════════════
// ARCHIVO 1: app/Infrastructure/Models/MultimediaAdjuntoModel.php
// ═════════════════════════════════════════════════════════════

namespace App\Infrastructure\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Storage;

class MultimediaAdjuntoModel extends Model
{
    use HasUuids;

    protected $table      = 'multimedia_adjuntos';
    protected $primaryKey = 'id';
    public    $timestamps = false;           // Usamos creado_en del dominio

    protected $fillable = [
        'id',
        'bien_cultural_id',
        'tipo',
        'nombre_original',
        'ruta_almacenamiento',
        'mime_type',
        'tamano_bytes',
        'duracion_segundos',
        'ancho_pixeles',
        'alto_pixeles',
        'creado_en',
    ];

    protected $casts = [
        'tamano_bytes'      => 'integer',
        'duracion_segundos' => 'integer',
        'ancho_pixeles'     => 'integer',
        'alto_pixeles'      => 'integer',
        'creado_en'         => 'datetime',
    ];

    // ── Relaciones ───────────────────────────────────────────

    public function bienCultural()
    {
        return $this->belongsTo(
            \App\Infrastructure\Models\BienCulturalModel::class,
            'bien_cultural_id'
        );
    }

    // ── Accessors ────────────────────────────────────────────

    /** URL pública del archivo (usa el disco configurado) */
    public function getUrlAttribute(): string
    {
        return Storage::disk('bienes_culturales')->url($this->ruta_almacenamiento);
    }

    /** Tamaño legible por humanos: "1.2 MB" */
    public function getTamanoLegibleAttribute(): string
    {
        $kb = $this->tamano_bytes / 1024;
        if ($kb < 1024) return round($kb, 1) . ' KB';
        return round($kb / 1024, 2) . ' MB';
    }

    protected $appends = ['url', 'tamano_legible'];
}
