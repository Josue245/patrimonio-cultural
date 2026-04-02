<?php
// database/migrations/2024_01_01_000003_create_bienes_culturales_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Habilitar extensión PostGIS
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');

        Schema::create('bienes_culturales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre');
            $table->enum('tipo', ['arqueologico', 'inmaterial', 'documental', 'arquitectonico', 'natural']);
            $table->text('descripcion');
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);
            $table->decimal('altitud', 8, 2)->nullable();
            $table->enum('estado', ['excelente', 'bueno', 'regular', 'deteriorado', 'critico'])->default('bueno');
            $table->string('region_geografica');
            $table->string('periodo_historico');
            $table->enum('idioma', ['es', 'qu', 'ay'])->default('es');
            $table->uuid('comunidad_id')->nullable();
            $table->foreign('comunidad_id')->references('id')->on('comunidades')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Índices para búsqueda
            $table->index('tipo');
            $table->index('region_geografica');
            $table->index('estado');
            $table->index('idioma');
        });

        // Columna geometry PostGIS (no soportada nativamente por Blueprint)
        DB::statement('ALTER TABLE bienes_culturales ADD COLUMN coordenadas geometry(Point, 4326)');
        DB::statement('CREATE INDEX idx_bienes_culturales_coordenadas ON bienes_culturales USING GIST(coordenadas)');

        // Índice de texto completo para búsqueda
        DB::statement("CREATE INDEX idx_bienes_culturales_fts ON bienes_culturales USING GIN(to_tsvector('spanish', nombre || ' ' || descripcion))");
    }

    public function down(): void
    {
        Schema::dropIfExists('bienes_culturales');
    }
};
