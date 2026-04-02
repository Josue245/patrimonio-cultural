<?php

namespace App\Domain\BienCultural\Entities;

use App\Domain\BienCultural\ValueObjects\TipoPatrimonio;
use App\Domain\BienCultural\ValueObjects\GeoPoint;
use App\Domain\BienCultural\ValueObjects\EstadoConservacion;

class BienCultural
{
    private string $id;
    private string $nombre;
    private TipoPatrimonio $tipo;
    private string $descripcion;
    private GeoPoint $coordenadas;
    private EstadoConservacion $estado;
    private string $regionGeografica;
    private string $periodoHistorico;
    private ?string $comunidadId;
    private string $idioma;
    private \DateTimeImmutable $creadoEn;
    private \DateTimeImmutable $actualizadoEn;

    public function __construct(
        string $id,
        string $nombre,
        TipoPatrimonio $tipo,
        string $descripcion,
        GeoPoint $coordenadas,
        EstadoConservacion $estado,
        string $regionGeografica,
        string $periodoHistorico,
        string $idioma = 'es',
        ?string $comunidadId = null,
    ) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->tipo = $tipo;
        $this->descripcion = $descripcion;
        $this->coordenadas = $coordenadas;
        $this->estado = $estado;
        $this->regionGeografica = $regionGeografica;
        $this->periodoHistorico = $periodoHistorico;
        $this->idioma = $idioma;
        $this->comunidadId = $comunidadId;
        $this->creadoEn = new \DateTimeImmutable();
        $this->actualizadoEn = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getNombre(): string { return $this->nombre; }
    public function getTipo(): TipoPatrimonio { return $this->tipo; }
    public function getDescripcion(): string { return $this->descripcion; }
    public function getCoordenadas(): GeoPoint { return $this->coordenadas; }
    public function getEstado(): EstadoConservacion { return $this->estado; }
    public function getRegionGeografica(): string { return $this->regionGeografica; }
    public function getPeriodoHistorico(): string { return $this->periodoHistorico; }
    public function getIdioma(): string { return $this->idioma; }
    public function getComunidadId(): ?string { return $this->comunidadId; }
    public function getCreadoEn(): \DateTimeImmutable { return $this->creadoEn; }

    public function actualizar(
        string $nombre,
        string $descripcion,
        EstadoConservacion $estado,
        string $periodoHistorico,
    ): void {
        $this->nombre = $nombre;
        $this->descripcion = $descripcion;
        $this->estado = $estado;
        $this->periodoHistorico = $periodoHistorico;
        $this->actualizadoEn = new \DateTimeImmutable();
    }

    public function toArray(): array
    {
        return [
            'id'                => $this->id,
            'nombre'            => $this->nombre,
            'tipo'              => $this->tipo->value,
            'descripcion'       => $this->descripcion,
            'coordenadas'       => $this->coordenadas->toArray(),
            'estado'            => $this->estado->value,
            'region_geografica' => $this->regionGeografica,
            'periodo_historico' => $this->periodoHistorico,
            'idioma'            => $this->idioma,
            'comunidad_id'      => $this->comunidadId,
            'creado_en'         => $this->creadoEn->format('Y-m-d H:i:s'),
            'actualizado_en'    => $this->actualizadoEn->format('Y-m-d H:i:s'),
        ];
    }
}
