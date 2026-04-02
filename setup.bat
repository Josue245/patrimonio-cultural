@echo off
setlocal enabledelayedexpansion
echo.
echo =====================================================
echo  PATRIMONIO CULTURAL ANDINO - Setup con Docker
echo =====================================================
echo.

docker --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker no esta instalado.
    echo Descarga Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker Desktop no esta corriendo.
    echo Abre Docker Desktop y espera que inicie completamente.
    pause
    exit /b 1
)
echo [OK] Docker Desktop detectado.
echo.

echo [LIMPIANDO] Deteniendo contenedores anteriores...
docker compose down --remove-orphans >nul 2>&1
echo.

echo [1/5] Construyendo contenedores (5-8 min la primera vez)...
docker compose up -d --build
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo al construir los contenedores.
    echo Ejecuta: docker compose logs
    pause
    exit /b 1
)
echo [OK] Contenedores iniciados.
echo.

echo [2/5] Esperando que PostgreSQL este listo...
:wait_pg
docker compose exec postgres pg_isready -U patrimonio_user -d patrimonio_junin >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    timeout /t 3 /nobreak >nul
    goto wait_pg
)
echo [OK] PostgreSQL listo.
echo.

echo [3/5] Esperando que el backend este listo...
:wait_be
docker compose exec backend php -r "echo 'ok';" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak >nul
    goto wait_be
)
echo [OK] Backend listo.
echo.

echo [4/5] Creando tablas en la base de datos...
docker compose exec backend php artisan migrate --force
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Las migraciones fallaron.
    echo Ejecuta: docker compose logs backend
    pause
    exit /b 1
)
echo [OK] Tablas creadas.
echo.

echo [5/5] Insertando datos de prueba...
docker compose exec backend php artisan db:seed --force
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Los seeders fallaron.
    echo Ejecuta: docker compose logs backend
    pause
    exit /b 1
)
echo [OK] Datos de prueba listos.
echo.

echo =====================================================
echo  INSTALACION COMPLETADA EXITOSAMENTE
echo.
echo  URLs del sistema:
echo.
echo   Frontend:     http://localhost:5173
echo   API:          http://localhost:8000/api/v1
echo   Swagger:      http://localhost:8000/api/documentation
echo   Servicio IA:  http://localhost:8001/health/
echo.
echo  Usuarios de prueba:
echo   admin@patrimoniojunin.gob.pe    Admin2024!
echo   investigador@patrimoniojunin.gob.pe  Invest2024!
echo   visitante@demo.com  visita123
echo.
echo  Comandos utiles:
echo   docker compose logs -f            (todos los logs)
echo   docker compose logs -f backend    (solo Laravel)
echo   docker compose logs -f django-ml  (solo IA)
echo   docker compose down               (detener todo)
echo   docker compose down -v            (detener + borrar BD)
echo =====================================================
echo.
pause
