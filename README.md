# Patrimonio Cultural Digital Andino — Region Junin

## Requisito unico: Docker Desktop
https://www.docker.com/products/docker-desktop

No necesitas PHP, Node.js, PostgreSQL ni Composer instalados localmente.

---

## Iniciar el proyecto

Doble clic en **`setup.bat`** — instala y configura todo (~5-8 min la primera vez).

---

## URLs

| Servicio      | URL                                    |
|---------------|----------------------------------------|
| Frontend      | http://localhost:5173                  |
| API REST      | http://localhost:8000/api/v1           |
| Swagger UI    | http://localhost:8000/api/documentation|
| Servicio IA   | http://localhost:8001/health/          |
| PostgreSQL    | localhost:5432                         |

---

## Usuarios de prueba

| Email                               | Password    | Rol           |
|-------------------------------------|-------------|---------------|
| admin@patrimoniojunin.gob.pe        | Admin2024!  | administrador |
| investigador@patrimoniojunin.gob.pe | Invest2024! | investigador  |
| visitante@demo.com                  | visita123   | visitante     |

---

## Swagger — Usar JWT

1. Abre http://localhost:8000/api/documentation
2. Haz POST a `/v1/auth/login` con las credenciales
3. Copia el `access_token` de la respuesta
4. Clic en el boton **Authorize** (candado)
5. Escribe: `Bearer <tu_token>` y confirma
6. Todos los endpoints protegidos funcionaran automaticamente

---

## Modulo IA (Groq)

La API key de Groq ya esta configurada. Capacidades disponibles:

- `POST /api/v1/ia/clasificar` — Clasifica tipo de patrimonio
- `POST /api/v1/ia/analizar` — Analisis profundo (requiere auth)
- `POST /api/v1/ia/similar` — Busqueda semantica (requiere auth)
- `POST /api/v1/ia/detectar-duplicado` — Detecta duplicados
- `POST /api/v1/ia/generar-descripcion` — Genera descripcion (requiere auth)
- `GET  /api/v1/ia/estado` — Estado del servicio

---

## Comandos utiles

```bat
docker compose logs -f              # Todos los logs
docker compose logs -f backend      # Solo Laravel
docker compose logs -f django-ml    # Solo servicio IA
docker compose logs -f nginx        # Solo Nginx
docker compose down                 # Detener todo
docker compose down -v              # Detener + borrar base de datos
docker compose restart backend      # Reiniciar solo backend
docker compose exec backend bash    # Entrar al contenedor backend
docker compose exec backend php artisan migrate:status
docker compose exec backend php artisan route:list
```

---

## Estructura del proyecto

```
patrimonio-cultural/
├── setup.bat                    Instalacion automatica Windows
├── docker-compose.yml           Orquestacion de servicios
├── nginx/default.conf           Configuracion Nginx
│
├── backend/                     Laravel 10 + PHP 8.3
│   ├── Dockerfile               PHP 8.3-fpm + Composer
│   ├── docker-entrypoint.sh     Genera keys, swagger, inicia php-fpm
│   ├── app/Domain/              Entidades, Value Objects
│   ├── app/Application/         Servicios, Puertos, DTOs
│   ├── app/Infrastructure/      Controllers, Models, Adapters
│   ├── config/                  14 archivos de configuracion
│   └── database/                Migraciones + Seeders
│
├── ml-service/                  Django 4.2 + Groq + scikit-learn
│   └── app/services/            groq_service, clasificador, etc.
│
└── frontend/                    React 18 + Vite + Tailwind 3
    └── src/pages/ia/            Panel IA con 4 herramientas
```
