import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from ..services.groq_service import get_groq_service
from ..services.clasificador import get_clasificador
from ..services.detector_duplicados import get_detector
from ..services.buscador_semantico import get_buscador
from rest_framework.response import Response
from rest_framework.views import APIView

class EstadoView(APIView):
    def get(self, request):
        return Response({
            'status': 'ok',
            'servicio': 'Django ML Service',
            'version': '1.0.0',
            'modelos': ['clasificador', 'similitud', 'duplicados'],
        })

class ClasificarPatrimonioView(APIView):
    """POST /ml/clasificar/ — Clasifica tipo de patrimonio con Groq."""

    def post(self, request):
        nombre      = request.data.get('nombre', '').strip()
        descripcion = request.data.get('descripcion', '').strip()

        if not nombre and not descripcion:
            return Response(
                {'error': 'Se requiere nombre o descripcion.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            groq      = get_groq_service()
            resultado = groq.clasificar(nombre, descripcion)
            return Response({'success': True, 'data': resultado})
        except Exception as e:
            return Response({'success': False, 'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnalizarBienView(APIView):
    """POST /ml/analizar/ — Análisis profundo de un bien cultural."""

    def post(self, request):
        bien = request.data.get('bien')
        if not bien or not isinstance(bien, dict):
            return Response({'error': 'Se requiere objeto bien.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            groq      = get_groq_service()
            resultado = groq.analizar_bien(bien)
            return Response({'success': True, 'data': resultado})
        except Exception as e:
            return Response({'success': False, 'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatrimonioSimilarView(APIView):
    """POST /ml/similar/ — Búsqueda semántica con re-ranking Groq."""

    def post(self, request):
        query  = request.data.get('query', '').strip()
        bienes = request.data.get('bienes', [])
        top_k  = int(request.data.get('top_k', 5))

        if not query:
            return Response({'error': 'El campo query es requerido.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(bienes, list):
            return Response({'error': 'bienes debe ser una lista.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            groq      = get_groq_service()
            resultado = groq.buscar_semantico(query, bienes, top_k)
            return Response({
                'success':    True,
                'query':      query,
                'total':      len(resultado.get('resultados', [])),
                'resultados': resultado.get('resultados', []),
                'fuente':     resultado.get('fuente', 'local'),
            })
        except Exception as e:
            return Response({'success': False, 'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DetectarDuplicadosView(APIView):
    """POST /ml/duplicados/ — Detección de duplicados con Groq + TF-IDF."""

    def post(self, request):
        nuevo      = request.data.get('nuevo')
        existentes = request.data.get('existentes', [])

        if not nuevo:
            return Response({'error': 'Se requiere el objeto nuevo.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            groq      = get_groq_service()
            resultado = groq.detectar_duplicados(nuevo, existentes)
            return Response({'success': True, 'data': resultado})
        except Exception as e:
            return Response({'success': False, 'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerarDescripcionView(APIView):
    """POST /ml/generar-descripcion/ — Genera descripción enriquecida con Groq."""

    def post(self, request):
        datos = request.data.get('datos')
        if not datos:
            return Response({'error': 'Se requiere el objeto datos.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            groq      = get_groq_service()
            resultado = groq.generar_descripcion(datos)
            return Response({'success': True, 'data': resultado})
        except Exception as e:
            return Response({'success': False, 'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EntrenarModeloView(APIView):
    """POST /ml/entrenar/ — Re-entrena modelo TF-IDF local."""

    def post(self, request):
        token = request.data.get('token')
        if token != settings.ML_INTERNAL_TOKEN:
            return Response({'error': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        datos_raw  = request.data.get('datos_extra', [])
        datos_proc = [(d['texto'], d['tipo']) for d in datos_raw
                      if 'texto' in d and 'tipo' in d]
        try:
            clf       = get_clasificador()
            resultado = clf.entrenar(datos_proc if datos_proc else None)
            return Response({'success': True, 'data': resultado})
        except Exception as e:
            return Response({'success': False, 'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EstadisticasIAView(APIView):
    """GET /ml/estadisticas-ia/ — Estado del servicio IA."""

    def get(self, request):
        groq     = get_groq_service()
        api_key  = getattr(settings, 'GROQ_API_KEY', '')

        return Response({
            'success': True,
            'data': {
                'groq_disponible':  groq.client is not None,
                'groq_modelo':      getattr(settings, 'GROQ_MODEL', 'llama3-8b-8192'),
                'groq_configurado': bool(api_key),
                'fallback_activo':  groq.client is None,
                'capacidades': [
                    'clasificacion_tipo_patrimonio',
                    'analisis_bien_cultural',
                    'busqueda_semantica',
                    'deteccion_duplicados',
                    'generacion_descripcion',
                ],
                'tipos_soportados': [
                    'arqueologico', 'inmaterial', 'documental',
                    'arquitectonico', 'natural',
                ],
                'version': '2.0.0-groq',
            }
        })
