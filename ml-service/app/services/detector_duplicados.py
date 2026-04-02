"""
Detector de registros duplicados usando similitud TF-IDF + coseno.
Alerta cuando un nuevo bien cultural es muy similar a uno ya existente.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


UMBRAL_DUPLICADO  = 0.60   # similitud >= 60% → duplicado probable
UMBRAL_SOSPECHOSO = 0.35   # similitud >= 35% → revisar manualmente


class DetectorDuplicados:

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),
            min_df=1,
            strip_accents='unicode',
            lowercase=True,
        )

    def detectar(self, nuevo: dict, existentes: list[dict]) -> dict:
        """
        Compara un bien nuevo contra una lista de bienes existentes.

        nuevo:      {'id': ..., 'nombre': ..., 'descripcion': ..., 'region': ...}
        existentes: lista de dicts con la misma estructura

        Retorna:
        {
            'es_duplicado': bool,
            'nivel': 'duplicado' | 'sospechoso' | 'unico',
            'similares': [ {'id', 'nombre', 'similitud', 'region'}, ... ]
        }
        """
        if not existentes:
            return {'es_duplicado': False, 'nivel': 'unico', 'similares': []}

        def texto(b: dict) -> str:
            return f"{b.get('nombre','')} {b.get('descripcion','')} {b.get('region_geografica','')}".lower()

        corpus = [texto(b) for b in existentes]
        nuevo_texto = texto(nuevo)

        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus + [nuevo_texto])
        except Exception:
            return {'es_duplicado': False, 'nivel': 'unico', 'similares': []}

        similitudes = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])[0]

        similares = []
        for i, sim in enumerate(similitudes):
            if sim >= UMBRAL_SOSPECHOSO:
                similares.append({
                    'id':        existentes[i].get('id'),
                    'nombre':    existentes[i].get('nombre'),
                    'region':    existentes[i].get('region_geografica'),
                    'similitud': round(float(sim), 4),
                })

        similares.sort(key=lambda x: x['similitud'], reverse=True)

        max_sim = max(similitudes) if len(similitudes) > 0 else 0

        if max_sim >= UMBRAL_DUPLICADO:
            nivel = 'duplicado'
        elif max_sim >= UMBRAL_SOSPECHOSO:
            nivel = 'sospechoso'
        else:
            nivel = 'unico'

        return {
            'es_duplicado':      nivel == 'duplicado',
            'nivel':             nivel,
            'similitud_maxima':  round(float(max_sim), 4),
            'similares':         similares[:5],
        }


_detector_instance = None

def get_detector() -> DetectorDuplicados:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = DetectorDuplicados()
    return _detector_instance
