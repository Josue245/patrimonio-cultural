<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Usuarios — insertOrIgnore evita error si ya existen ───────────
        $adminId = Str::uuid();
        $invId   = Str::uuid();

        $users = [
            [
                'id'         => Str::uuid()->toString(),
                'name'       => 'Administrador DIRCETUR',
                'email'      => 'admin@patrimoniojunin.gob.pe',
                'password'   => Hash::make('Admin2024!'),
                'rol'        => 'administrador',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => Str::uuid()->toString(),
                'name'       => 'Investigador Andino',
                'email'      => 'investigador@patrimoniojunin.gob.pe',
                'password'   => Hash::make('Invest2024!'),
                'rol'        => 'investigador',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => Str::uuid()->toString(),
                'name'       => 'Visitante Demo',
                'email'      => 'visitante@demo.com',
                'password'   => Hash::make('visita123'),
                'rol'        => 'visitante',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                $user
            );
        }

        // Obtener IDs reales de la BD para usarlos en relaciones
        $adminId = DB::table('users')->where('email', 'admin@patrimoniojunin.gob.pe')->value('id');
        $invId   = DB::table('users')->where('email', 'investigador@patrimoniojunin.gob.pe')->value('id');

        // ── Comunidades — updateOrInsert evita duplicados ─────────────────
        $comunidadNombre = 'Comunidad Campesina de Concepción';
        $comunidadExiste = DB::table('comunidades')->where('nombre', $comunidadNombre)->first();

        if ($comunidadExiste) {
            $comunidadId = $comunidadExiste->id;
        } else {
            $comunidadId = Str::uuid()->toString();
            DB::table('comunidades')->insert([
                'id'              => $comunidadId,
                'nombre'          => $comunidadNombre,
                'region'          => 'Junín',
                'lengua_principal' => 'qu',
                'descripcion'     => 'Comunidad quechuahablante del Valle del Mantaro.',
                'latitud'         => -11.9167,
                'longitud'        => -75.3167,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        // ── Bienes Culturales — updateOrInsert por nombre único ───────────
        $bienes = [
            [
                'nombre'            => 'Zona Arqueológica de Huari Vilca',
                'tipo'              => 'arqueologico',
                'descripcion'       => 'Complejo arqueológico Wari ubicado en Huancayo, correspondiente al período del Horizonte Medio (600-1000 d.C.). Contiene estructuras de adobe y piedra con evidencia de actividad ceremonial y administrativa.',
                'latitud'           => -12.0623,
                'longitud'          => -75.2053,
                'altitud'           => 3271.0,
                'estado'            => 'regular',
                'region_geografica' => 'Huancayo',
                'periodo_historico' => 'Horizonte Medio (600-1000 d.C.)',
                'idioma'            => 'es',
                'comunidad_id'      => null,
            ],
            [
                'nombre'            => 'Danza de las Tijeras del Valle del Mantaro',
                'tipo'              => 'inmaterial',
                'descripcion'       => 'Expresión dancística andina declarada Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO en 2010. Los danzantes (danzaq) ejecutan acrobacias rituales al son de arpa y violín, portando tijeras de metal.',
                'latitud'           => -11.9333,
                'longitud'          => -75.2000,
                'altitud'           => 3254.0,
                'estado'            => 'excelente',
                'region_geografica' => 'Valle del Mantaro',
                'periodo_historico' => 'Colonial — presente',
                'idioma'            => 'qu',
                'comunidad_id'      => $comunidadId,
            ],
            [
                'nombre'            => 'Santuario Histórico de Chacamarca',
                'tipo'              => 'arqueologico',
                'descripcion'       => 'Campo de batalla de la Batalla de Junín (6 de agosto de 1824), donde el ejército libertador comandado por Simón Bolívar derrotó a las fuerzas realistas. Área protegida de 2,628 hectáreas en la puna juneña.',
                'latitud'           => -11.2167,
                'longitud'          => -76.0833,
                'altitud'           => 4087.0,
                'estado'            => 'bueno',
                'region_geografica' => 'Junín',
                'periodo_historico' => 'República (1824)',
                'idioma'            => 'es',
                'comunidad_id'      => null,
            ],
            [
                'nombre'            => 'Textiles Bordados de Hualhuas',
                'tipo'              => 'inmaterial',
                'descripcion'       => 'Tradición textil del distrito de Hualhuas, reconocida por sus tapices y prendas con motivos andinos tejidos en telar de cintura. Técnica transmitida generacionalmente por las comunidades quechuahablantes del Valle del Mantaro.',
                'latitud'           => -12.0833,
                'longitud'          => -75.2167,
                'altitud'           => 3200.0,
                'estado'            => 'bueno',
                'region_geografica' => 'Huancayo',
                'periodo_historico' => 'Prehispánico — presente',
                'idioma'            => 'qu',
                'comunidad_id'      => $comunidadId,
            ],
            [
                'nombre'            => 'Complejo Arqueológico de Tunanmarca',
                'tipo'              => 'arqueologico',
                'descripcion'       => 'Ciudad prehispánica xauxa del período Intermedio Tardío (1000-1470 d.C.), ubicada en las alturas de Junín. Contiene más de 2,000 estructuras circulares de piedra que evidencian un importante centro político y ceremonial.',
                'latitud'           => -11.7500,
                'longitud'          => -75.4333,
                'altitud'           => 3900.0,
                'estado'            => 'deteriorado',
                'region_geografica' => 'Junín - Jauja',
                'periodo_historico' => 'Intermedio Tardío (1000-1470 d.C.)',
                'idioma'            => 'qu',
                'comunidad_id'      => null,
            ],
        ];

        foreach ($bienes as $bien) {
            $lat  = $bien['latitud'];
            $lon  = $bien['longitud'];
            $existe = DB::table('bienes_culturales')->where('nombre', $bien['nombre'])->first();

            if ($existe) {
                // Already exists — just update the PostGIS column to be sure
                $id = $existe->id;
            } else {
                $id = Str::uuid()->toString();
                DB::table('bienes_culturales')->insert(array_merge($bien, [
                    'id'         => $id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }

            // Ensure PostGIS geometry column is set
            DB::statement(
                "UPDATE bienes_culturales SET coordenadas = ST_GeomFromText('POINT({$lon} {$lat})', 4326) WHERE id = '{$id}'"
            );
        }
    }
}
