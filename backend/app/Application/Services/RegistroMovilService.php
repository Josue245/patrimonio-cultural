<?php

declare(strict_types=1);

namespace App\Application\Services;

use App\Application\DTOs\RegistroMovilDTO;
use App\Application\Ports\Contracts\RegistrarBienMovilPortInterface;
use App\Application\Ports\Contracts\MultimediaPortInterface;
use App\Domain\BienCultural\Factories\BienCulturalFactory;
use App\Domain\BienCultural\Repositories\BienCulturalRepositoryInterface;
use App\Domain\BienCultural\ValueObjects\EstadoConservacion;
use App\Domain\BienCultural\ValueObjects\TipoPatrimonio;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class RegistroMovilService implements RegistrarBienMovilPortInterface
{
    public function __construct(
        private readonly MultimediaPortInterface          $multimedia,
        private readonly BienCulturalRepositoryInterface $bienRepo,
        private readonly BienCulturalFactory             $factory,
    ) {}

    public function ejecutar(RegistroMovilDTO $dto): array
{
    // Validación básica de coordenadas
    if ($dto->latitud < -90 || $dto->latitud > 90) {
        throw new \DomainException("Latitud inválida: {$dto->latitud}");
    }
    if ($dto->longitud < -180 || $dto->longitud > 180) {
        throw new \DomainException("Longitud inválida: {$dto->longitud}");
    }

    return DB::transaction(function () use ($dto): array {

        $bien = $this->factory->crear(
            id:               Str::uuid()->toString(),
            nombre:           $dto->nombre,
            tipo:             TipoPatrimonio::from($dto->tipo),
            descripcion:      $dto->descripcion ?? '',
            latitud:          $dto->latitud,
            longitud:         $dto->longitud,
            altitud:          $dto->altitud,
            estado:           EstadoConservacion::from($dto->estadoConservacion),
            regionGeografica: $dto->provincia ?? 'Junín',
            periodoHistorico: null,
            idioma:           'es',
            comunidadId:      null,
        );

        $this->bienRepo->save($bien);
        $bienId = $bien->getId();

        $fotosGuardadas = [];
        foreach ($dto->fotos as $foto) {
            if (! $foto || ! $foto->isValid()) continue;
            $url = $this->multimedia->subir(
                nombreArchivo: "fotos/{$bienId}/" . uniqid() . '.' . $foto->extension(),
                contenido:     file_get_contents($foto->getRealPath()),
                mimeType:      $foto->getMimeType(),
            );
            $fotosGuardadas[] = ['url' => $url, 'tipo' => 'foto'];
        }

        $audiosGuardados = [];
        foreach ($dto->audios as $idx => $audio) {
            if (! $audio || ! $audio->isValid()) continue;
            $url = $this->multimedia->subir(
                nombreArchivo: "audios/{$bienId}/" . uniqid() . '.' . $audio->extension(),
                contenido:     file_get_contents($audio->getRealPath()),
                mimeType:      $audio->getMimeType(),
            );
            $audiosGuardados[] = [
                'url'      => $url,
                'tipo'     => 'audio',
                'duracion' => $dto->audiosDuracion[$idx] ?? 0,
            ];
        }

        Log::info('[RegistroMovil] Bien registrado desde campo', [
            'bien_id' => $bienId,
            'fotos'   => count($fotosGuardadas),
            'audios'  => count($audiosGuardados),
        ]);

        return [
            'data' => array_merge($bien->toArray(), [
                'fotos'  => $fotosGuardadas,
                'audios' => $audiosGuardados,
            ]),
            'message' => 'Bien cultural registrado exitosamente.',
        ];
    });
}}