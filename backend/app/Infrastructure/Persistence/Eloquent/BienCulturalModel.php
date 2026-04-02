<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class BienCulturalModel extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'bienes_culturales';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nombre',
        'tipo',
        'descripcion',
        'latitud',
        'longitud',
        'altitud',
        'coordenadas',      // PostGIS geometry column
        'estado',
        'region_geografica',
        'periodo_historico',
        'idioma',
        'comunidad_id',
    ];

    protected $casts = [
        'latitud'  => 'float',
        'longitud' => 'float',
        'altitud'  => 'float',
    ];

    protected $hidden = ['deleted_at'];

    public function comunidad()
    {
        return $this->belongsTo(ComunidadModel::class, 'comunidad_id');
    }

    public function multimedia()
    {
        return $this->hasMany(MultimediaModel::class, 'bien_cultural_id');
    }
}
