"""
Servicio principal de IA usando Groq API.
Maneja clasificación, análisis, búsqueda semántica y detección de duplicados
usando LLMs de Groq (llama3-8b-8192 por defecto).
"""

import json
import re
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("groq package not installed. Install with: pip install groq")


TIPOS_PATRIMONIO = [
    'arqueologico', 'inmaterial', 'documental', 'arquitectonico', 'natural'
]

SYSTEM_PROMPT = """Eres un experto en patrimonio cultural andino del Perú, 
especializado en la Región Junín. Analizas bienes culturales arqueológicos, 
inmateriales, documentales, arquitectónicos y naturales. 
Siempre respondes en español y en formato JSON válido sin bloques de código."""


class GroqService:

    def __init__(self):
        api_key = getattr(settings, 'GROQ_API_KEY', '')
        self.model = getattr(settings, 'GROQ_MODEL', 'llama3-8b-8192')
        self.client = None

        if GROQ_AVAILABLE and api_key:
            self.client = Groq(api_key=api_key)
        else:
            if not GROQ_AVAILABLE:
                logger.warning("Groq no disponible — usando fallback local.")
            elif not api_key:
                logger.warning("GROQ_API_KEY no configurada — usando fallback local.")

    def _chat(self, prompt: str, max_tokens: int = 800) -> str:
        """Llama a Groq y retorna el texto de respuesta."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()

    def _parse_json(self, text: str) -> dict:
        """Extrae JSON de la respuesta del LLM."""
        text = re.sub(r'```(?:json)?', '', text).strip().rstrip('`').strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
        return {}

    # ── Clasificación ──────────────────────────────────────────────────────

    def clasificar(self, nombre: str, descripcion: str) -> dict:
        """
        Clasifica el tipo de patrimonio cultural usando Groq.
        Retorna tipo predicho, confianza y justificación.
        """
        if not self.client:
            return self._fallback_clasificar(nombre, descripcion)

        prompt = f"""Clasifica este bien cultural del Patrimonio Cultural Andino de Junín, Perú.

Nombre: {nombre}
Descripción: {descripcion}

Tipos válidos: {', '.join(TIPOS_PATRIMONIO)}

Responde SOLO con este JSON:
{{
  "tipo_predicho": "<uno de los tipos válidos>",
  "confianza": <número entre 0.0 y 1.0>,
  "nivel_confianza": "<alto|medio|bajo>",
  "justificacion": "<explicación breve en español>",
  "palabras_clave": ["<palabra1>", "<palabra2>", "<palabra3>"],
  "probabilidades": [
    {{"tipo": "arqueologico", "confianza": 0.0}},
    {{"tipo": "inmaterial",   "confianza": 0.0}},
    {{"tipo": "documental",   "confianza": 0.0}},
    {{"tipo": "arquitectonico","confianza": 0.0}},
    {{"tipo": "natural",      "confianza": 0.0}}
  ]
}}"""

        try:
            texto = self._chat(prompt, max_tokens=500)
            data  = self._parse_json(texto)

            if not data.get('tipo_predicho') or data['tipo_predicho'] not in TIPOS_PATRIMONIO:
                return self._fallback_clasificar(nombre, descripcion)

            confianza = float(data.get('confianza', 0.5))
            data['nivel_confianza'] = (
                'alto'  if confianza >= 0.80 else
                'medio' if confianza >= 0.50 else
                'bajo'
            )
            data['fuente'] = 'groq'
            return data

        except Exception as e:
            logger.error(f"Groq clasificar error: {e}")
            return self._fallback_clasificar(nombre, descripcion)

    def _fallback_clasificar(self, nombre: str, descripcion: str) -> dict:
        """Clasificación local con keywords cuando Groq no está disponible."""
        from .clasificador import get_clasificador
        resultado = get_clasificador().clasificar(nombre, descripcion)
        resultado['fuente'] = 'local-ml'
        return resultado

    # ── Análisis completo ──────────────────────────────────────────────────

    def analizar_bien(self, bien: dict) -> dict:
        """
        Análisis profundo de un bien cultural:
        importancia histórica, estado de conservación recomendado, comunidades relacionadas, etc.
        """
        if not self.client:
            return {'error': 'Servicio Groq no disponible.', 'fuente': 'none'}

        prompt = f"""Analiza este bien del Patrimonio Cultural Andino de la Región Junín, Perú:

Nombre: {bien.get('nombre')}
Tipo: {bien.get('tipo')}
Descripción: {bien.get('descripcion')}
Región: {bien.get('region_geografica')}
Período: {bien.get('periodo_historico')}
Estado actual: {bien.get('estado')}

Responde SOLO con este JSON:
{{
  "importancia": "<descripción de importancia histórica y cultural>",
  "nivel_urgencia_conservacion": "<alta|media|baja>",
  "recomendaciones_conservacion": ["<acción 1>", "<acción 2>", "<acción 3>"],
  "comunidades_relacionadas": ["<comunidad o pueblo>"],
  "potencial_turistico": "<alto|medio|bajo>",
  "conexiones_historicas": "<con qué otros elementos del patrimonio andino se relaciona>",
  "valor_educativo": "<cómo puede usarse con fines educativos>"
}}"""

        try:
            texto = self._chat(prompt, max_tokens=700)
            data  = self._parse_json(texto)
            data['fuente'] = 'groq'
            return data
        except Exception as e:
            logger.error(f"Groq analizar_bien error: {e}")
            return {'error': str(e), 'fuente': 'groq-error'}

    # ── Detección de duplicados ────────────────────────────────────────────

    def detectar_duplicados(self, nuevo: dict, existentes: list) -> dict:
        """
        Usa Groq para detectar duplicados semánticos con comprensión contextual.
        Fallback a similitud TF-IDF si Groq no está disponible.
        """
        from .detector_duplicados import get_detector

        # Siempre hacer detección local primero (rápido)
        detector  = get_detector()
        resultado_local = detector.detectar(nuevo, existentes)

        # Si hay duplicados obvios (>85%) no necesitamos Groq
        if resultado_local.get('nivel') == 'duplicado':
            resultado_local['fuente'] = 'local-ml'
            return resultado_local

        # Si hay sospechosos, Groq valida con contexto
        if self.client and resultado_local.get('similares'):
            similares_texto = "\n".join([
                f"- ID:{s['id']} Nombre:{s['nombre']} Similitud:{s['similitud']}"
                for s in resultado_local['similares'][:3]
            ])

            prompt = f"""Analiza si este bien cultural es un duplicado de los existentes:

NUEVO:
Nombre: {nuevo.get('nombre')}
Descripción: {nuevo.get('descripcion', '')}
Región: {nuevo.get('region_geografica', '')}

CANDIDATOS SIMILARES:
{similares_texto}

¿Es el nuevo registro un duplicado real de alguno de los candidatos?
Responde SOLO con este JSON:
{{
  "es_duplicado": true/false,
  "nivel": "duplicado|sospechoso|unico",
  "razon": "<explicación breve>",
  "id_duplicado": "<id del duplicado o null>"
}}"""

            try:
                texto = self._chat(prompt, max_tokens=300)
                data  = self._parse_json(texto)
                if data:
                    resultado_local.update({
                        'es_duplicado': data.get('es_duplicado', resultado_local['es_duplicado']),
                        'nivel':        data.get('nivel',        resultado_local['nivel']),
                        'razon_groq':   data.get('razon', ''),
                        'fuente':       'groq+local',
                    })
                    return resultado_local
            except Exception as e:
                logger.error(f"Groq duplicados error: {e}")

        resultado_local['fuente'] = 'local-ml'
        return resultado_local

    # ── Búsqueda semántica ─────────────────────────────────────────────────

    def buscar_semantico(self, query: str, bienes: list, top_k: int = 5) -> dict:
        """
        Búsqueda semántica: primero filtra con TF-IDF, luego Groq re-rankea.
        """
        from .buscador_semantico import get_buscador

        buscador   = get_buscador()
        candidatos = buscador.buscar(query, bienes, top_k=top_k * 2)

        if not candidatos:
            return {'resultados': [], 'fuente': 'local-ml'}

        if not self.client or len(candidatos) == 0:
            return {'resultados': candidatos[:top_k], 'fuente': 'local-ml'}

        # Groq re-rankea los candidatos
        lista = "\n".join([
            f"{i+1}. [{b.get('tipo')}] {b.get('nombre')} — {b.get('descripcion','')[:80]}"
            for i, b in enumerate(candidatos)
        ])

        prompt = f"""El usuario busca: "{query}"

Candidatos de patrimonio cultural andino de Junín:
{lista}

Ordena los {top_k} más relevantes para la búsqueda.
Responde SOLO con este JSON:
{{
  "orden": [<índices 1-based en orden de relevancia, ej: [2, 1, 4]>],
  "razon": "<por qué este orden>"
}}"""

        try:
            texto = self._chat(prompt, max_tokens=200)
            data  = self._parse_json(texto)
            orden = data.get('orden', [])

            if orden and isinstance(orden, list):
                reordenados = []
                for idx in orden[:top_k]:
                    if 1 <= idx <= len(candidatos):
                        bien = candidatos[idx - 1].copy()
                        bien['relevancia_groq'] = True
                        reordenados.append(bien)
                if reordenados:
                    return {'resultados': reordenados, 'fuente': 'groq+local'}
        except Exception as e:
            logger.error(f"Groq buscar error: {e}")

        return {'resultados': candidatos[:top_k], 'fuente': 'local-ml'}

    # ── Generación de descripción ──────────────────────────────────────────

    def generar_descripcion(self, datos_parciales: dict) -> dict:
        """
        Genera una descripción enriquecida de un bien cultural
        a partir de datos parciales proporcionados por el usuario.
        """
        if not self.client:
            return {'error': 'Servicio Groq no disponible.'}

        prompt = f"""Genera una descripción académica y enriquecida para este bien del Patrimonio Cultural Andino de Junín, Perú:

Datos disponibles:
{json.dumps(datos_parciales, ensure_ascii=False, indent=2)}

Responde SOLO con este JSON:
{{
  "descripcion_generada": "<descripción completa y académica en español, 2-3 párrafos>",
  "palabras_clave":       ["<término1>", "<término2>", "<término3>"],
  "periodo_sugerido":     "<período histórico si no se especificó>",
  "tipo_sugerido":        "<tipo de patrimonio si no se especificó>"
}}"""

        try:
            texto = self._chat(prompt, max_tokens=600)
            data  = self._parse_json(texto)
            data['fuente'] = 'groq'
            return data
        except Exception as e:
            logger.error(f"Groq generar_descripcion error: {e}")
            return {'error': str(e)}


# Singleton
_groq_instance = None

def get_groq_service() -> GroqService:
    global _groq_instance
    if _groq_instance is None:
        _groq_instance = GroqService()
    return _groq_instance
