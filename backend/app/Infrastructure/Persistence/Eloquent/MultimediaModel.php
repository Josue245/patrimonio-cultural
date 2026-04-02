<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class MultimediaModel extends Model
{
    use HasUuids, SoftDeletes;

    protected $table      = 'multimedia';
    protected $keyType    = 'string';
    public    $incrementing = false;

    protected $fillable = [
        'id', 'bien_cultural_id', 'tipo', 'nombre_original',
        'ruta_storage', 'url_publica', 'mime_type',
        'tamano_bytes', 'descripcion', 'subido_por',
    ];

    public function bienCultural()
    {
        return $this->belongsTo(BienCulturalModel::class, 'bien_cultural_id');
    }
}
