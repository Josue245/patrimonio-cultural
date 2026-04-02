<?php

namespace App\Providers;

use App\Application\Ports\Contracts\GeoServicioPortInterface;
use App\Application\Ports\Contracts\MultimediaPortInterface;
use App\Application\Ports\Contracts\NotificacionPortInterface;
use App\Domain\BienCultural\Repositories\BienCulturalRepositoryInterface;
use App\Infrastructure\External\Geo\GoogleMapsGeoServicio;
use App\Infrastructure\External\Notification\SmtpNotificacionAdapter;
use App\Infrastructure\External\Storage\S3MultimediaAdapter;
use App\Infrastructure\Persistence\Repositories\EloquentBienCulturalRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Domain → Infrastructure bindings
        $this->app->bind(
            BienCulturalRepositoryInterface::class,
            EloquentBienCulturalRepository::class
        );

        // Port → Adapter OUT bindings
        $this->app->bind(
            NotificacionPortInterface::class,
            SmtpNotificacionAdapter::class
        );

        $this->app->bind(
            GeoServicioPortInterface::class,
            GoogleMapsGeoServicio::class
        );

        $this->app->bind(
            MultimediaPortInterface::class,
            S3MultimediaAdapter::class
        );
    }

    public function boot(): void
    {
        //
    }
}
