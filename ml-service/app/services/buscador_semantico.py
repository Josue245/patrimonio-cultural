"""
Búsqueda semántica de patrimonio cultural usando TF-IDF vectorization.
Permite encontrar bienes similares dado un query de texto libre.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class BuscadorSemantico:

    def buscar(self, query: str, bienes: list[dict], top_k: int = 5) -> list[dict]:
        """
        Busca los bienes más relevantes para un query de texto libre.

        query:  texto de búsqueda del usuario
        bienes: lista de dicts con 'id', 'nombre', 'descripcion', 'tipo', 'region_geografica'
        top_k:  número máximo de resultados

        Retorna lista ordenada por relevancia.
        """
        if not bienes or not query.strip():
            return []

        def texto(b: dict) -> str:
            return f"{b.get('nombre','')} {b.get('descripcion','')} {b.get('tipo','')} {b.get('region_geografica','')}".lower()

        corpus = [texto(b) for b in bienes]

        try:
            vectorizer   = TfidfVectorizer(
                analyzer='word',
                ngram_range=(1, 2),
                min_df=1,
                strip_accents='unicode',
                lowercase=True,
            )
            tfidf_corpus = vectorizer.fit_transform(corpus)
            tfidf_query  = vectorizer.transform([query.lower()])
            similitudes  = cosine_similarity(tfidf_query, tfidf_corpus)[0]
        except Exception:
            return []

        indices_ordenados = np.argsort(similitudes)[::-1]

        resultados = []
        for idx in indices_ordenados[:top_k]:
            sim = float(similitudes[idx])
            if sim > 0.01:  # descartar matches vacíos
                bien = bienes[idx].copy()
                bien['relevancia'] = round(sim, 4)
                resultados.append(bien)

        return resultados


_buscador_instance = None

def get_buscador() -> BuscadorSemantico:
    global _buscador_instance
    if _buscador_instance is None:
        _buscador_instance = BuscadorSemantico()
    return _buscador_instance
