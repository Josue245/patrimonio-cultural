<?php

declare(strict_types=1);

namespace App\Providers;

use App\Application\Ports\Contracts\RegistrarBienMovilPortInterface;
use App\Application\Services\RegistroMovilService;
use Illuminate\Support\ServiceProvider;

final class RegistroMovilServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            RegistrarBienMovilPortInterface::class,
            RegistroMovilService::class,
        );
    }

    public function boot(): void
    {
        $this->app['config']->set('filesystems.disks.bienes_culturales', [
            'driver'     => env('MULTIMEDIA_DRIVER', 'local'),
            'root'       => storage_path('app/bienes_culturales'),
            'url'        => env('APP_URL') . '/storage/bienes_culturales',
            'visibility' => 'public',
        ]);
    }
}