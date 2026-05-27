<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bienes_culturales', function (Blueprint $table) {
            if (! Schema::hasColumn('bienes_culturales', 'latitud')) {
                $table->decimal('latitud', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('bienes_culturales', 'longitud')) {
                $table->decimal('longitud', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('bienes_culturales', 'altitud')) {
                $table->decimal('altitud', 8, 2)->nullable();
            }
            if (! Schema::hasColumn('bienes_culturales', 'precision_gps')) {
                $table->unsignedSmallInteger('precision_gps')->nullable();
            }
            if (! Schema::hasColumn('bienes_culturales', 'origen_movil')) {
                $table->boolean('origen_movil')->default(false);
            }
            if (! Schema::hasIndex('bienes_culturales', 'idx_bienes_coordenadas')) {
                $table->index(['latitud', 'longitud'], 'idx_bienes_coordenadas');
            }
        });

        Schema::create('multimedia_adjuntos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('bien_cultural_id')
                  ->constrained('bienes_culturales')
                  ->cascadeOnDelete();
            $table->enum('tipo', ['foto', 'audio']);
            $table->string('nombre_original', 255);
            $table->string('ruta_almacenamiento', 512);
            $table->string('mime_type', 100);
            $table->unsignedInteger('tamano_bytes');
            $table->unsignedSmallInteger('duracion_segundos')->nullable();
            $table->unsignedSmallInteger('ancho_pixeles')->nullable();
            $table->unsignedSmallInteger('alto_pixeles')->nullable();
            $table->timestampTz('creado_en')->useCurrent();
            $table->index(['bien_cultural_id', 'tipo'], 'idx_multimedia_bien_tipo');
            $table->index('creado_en', 'idx_multimedia_fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('multimedia_adjuntos');

        Schema::table('bienes_culturales', function (Blueprint $table) {
            $table->dropIndex('idx_bienes_coordenadas');
            $table->dropColumn([
                'latitud', 'longitud', 'altitud', 'precision_gps', 'origen_movil',
            ]);
        });
    }
};