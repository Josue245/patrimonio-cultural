<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tymon\JWTAuth\Contracts\JWTSubject;

class UserModel extends Authenticatable implements JWTSubject
{
    use HasUuids, SoftDeletes;

    protected $table      = 'users';
    protected $keyType    = 'string';
    public    $incrementing = false;

    protected $fillable = ['name', 'email', 'password', 'rol'];
    protected $hidden   = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return ['rol' => $this->rol];
    }
}
