<?php
// database/migrations/2024_01_01_000004_create_multimedia_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('multimedia', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bien_cultural_id');
            $table->foreign('bien_cultural_id')->references('id')->on('bienes_culturales')->cascadeOnDelete();
            $table->enum('tipo', ['fotografia', 'video', 'audio', 'documento']);
            $table->string('nombre_original');
            $table->string('ruta_storage');
            $table->string('url_publica')->nullable();
            $table->string('mime_type');
            $table->unsignedBigInteger('tamano_bytes');
            $table->string('descripcion')->nullable();
            $table->uuid('subido_por');
            $table->foreign('subido_por')->references('id')->on('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('multimedia');
    }
};
