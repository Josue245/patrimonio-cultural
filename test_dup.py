import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from app.services.groq_service import get_groq_service
groq = get_groq_service()
print(f'Cliente disponible: {groq.client is not None}')
print(f'Modelo: {groq.model}')

nuevo = {'nombre': 'Iglesia', 'descripcion': 'Templo', 'region_geografica': 'Junín'}
existentes = [{'nombre': 'Santuario', 'descripcion': 'Templo', 'region_geografica': 'Junín'}]

resultado = groq.detectar_duplicados(nuevo, existentes)
print(f'Fuente: {resultado.get("fuente")}')
print(f'Nivel: {resultado.get("nivel")}')
