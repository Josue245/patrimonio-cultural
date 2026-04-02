<?php

namespace App\Infrastructure\External\Notification;

use App\Application\Ports\Contracts\NotificacionPortInterface;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SmtpNotificacionAdapter implements NotificacionPortInterface
{
    public function enviarAlerta(string $asunto, string $mensaje, array $destinatarios = []): void
    {
        $to = empty($destinatarios)
            ? [config('mail.from.address')]
            : $destinatarios;

        try {
            Mail::raw($mensaje, function ($mail) use ($asunto, $to) {
                $mail->to($to)->subject($asunto);
            });
        } catch (\Throwable $e) {
            Log::error('SmtpNotificacionAdapter: ' . $e->getMessage());
        }
    }

    public function notificarAdmin(string $evento, array $contexto = []): void
    {
        $asunto  = "[Patrimonio Junín] Evento: {$evento}";
        $mensaje = "Evento detectado: {$evento}\n\n" . json_encode($contexto, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $this->enviarAlerta($asunto, $mensaje);
    }
}
