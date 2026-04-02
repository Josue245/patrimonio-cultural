<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class ComunidadModel extends Model
{
    use HasUuids, SoftDeletes;

    protected $table      = 'comunidades';
    protected $keyType    = 'string';
    public    $incrementing = false;

    protected $fillable = [
        'id', 'nombre', 'region', 'lengua_principal',
        'descripcion', 'latitud', 'longitud',
    ];

    public function bienes()
    {
        return $this->hasMany(BienCulturalModel::class, 'comunidad_id');
    }
}
