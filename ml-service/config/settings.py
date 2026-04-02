import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG      = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'corsheaders',
    'app.api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF       = 'config.urls'
WSGI_APPLICATION   = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     os.environ.get('DB_DATABASE', 'patrimonio_junin'),
        'USER':     os.environ.get('DB_USERNAME',  'patrimonio_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD',  'patrimonio_pass'),
        'HOST':     os.environ.get('DB_HOST',       'postgres'),
        'PORT':     os.environ.get('DB_PORT',        '5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

CORS_ALLOW_ALL_ORIGINS = True

LANGUAGE_CODE = 'es-pe'
TIME_ZONE     = 'America/Lima'
USE_I18N      = True
USE_TZ        = True

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Groq API
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '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')
GROQ_MODEL   = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')

# ML fallback models path
ML_MODELS_DIR = BASE_DIR / 'data' / 'models'
ML_MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Internal token for Laravel → Django calls
ML_INTERNAL_TOKEN = os.environ.get('ML_INTERNAL_TOKEN', 'patrimonio-ml-internal-2024')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
