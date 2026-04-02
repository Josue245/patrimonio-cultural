<?php

namespace App\Application\Ports\Contracts;

interface NotificacionPortInterface
{
    public function enviarAlerta(string $asunto, string $mensaje, array $destinatarios = []): void;
    public function notificarAdmin(string $evento, array $contexto = []): void;
}
