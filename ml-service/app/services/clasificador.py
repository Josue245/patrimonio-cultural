"""
Servicio de clasificación de patrimonio cultural usando scikit-learn.
Clasifica bienes culturales por tipo basándose en su descripción y metadatos.
"""

import os
import joblib
import numpy as np
from pathlib import Path
from django.conf import settings

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder


TIPOS_PATRIMONIO = [
    'arqueologico',
    'inmaterial',
    'documental',
    'arquitectonico',
    'natural',
]

# Datos de entrenamiento base (ejemplos representativos por tipo)
DATOS_ENTRENAMIENTO = [
    # arqueologico
    ("sitio arqueológico ruinas andenas chullpas cerámica lítica precolombino excavación fósil restos óseos", "arqueologico"),
    ("complejo arqueológico huari inca tiahuanaco pirámide andén terraza agrícola wari", "arqueologico"),
    ("cerámica precolombina fragmentos líticos puntas proyectil obsidiana sílex", "arqueologico"),
    ("tumba sepulcro enterramiento fúnebre ajuar funerario momia mausoleo", "arqueologico"),
    ("petroglifo geoglifo línea nasca pictografía rupestre grabado piedra", "arqueologico"),
    ("zona arqueológica monumento prehispánico vestigio resto material", "arqueologico"),

    # inmaterial
    ("danza tradición oral fiesta patronal música quechua aymara costumbre ritual ceremonia", "inmaterial"),
    ("tejido bordado artesanía textil telar cintura técnica ancestral comunidad", "inmaterial"),
    ("lengua idioma dialecto quechua aymara tradición oral narrativa mito leyenda", "inmaterial"),
    ("medicina tradicional curandera chamán herbolaria planta medicinal ritual curación", "inmaterial"),
    ("carnaval festejo danza tijeras huayno wayno marinera fiesta andina celebración", "inmaterial"),
    ("gastronomía receta comida ancestral preparación tradicional pachamanca", "inmaterial"),

    # documental
    ("documento manuscrito archivo colonial virreinal cédula real expediente judicial", "documental"),
    ("fotografía histórica colección documental archivo fotográfico imagen antigua", "documental"),
    ("mapa plano cartografía histórica territorio colonial plan ciudad", "documental"),
    ("libro incunable impreso colonial manuscrito ilustrado pergamino", "documental"),
    ("registro parroquial nacimiento matrimonio defunción libro iglesia", "documental"),

    # arquitectonico
    ("iglesia catedral templo colonial virreinal fachada baroque ornamental torre campanario", "arquitectonico"),
    ("puente inca camino qhapaq ñan calzada empedrada red vial andina", "arquitectonico"),
    ("edificio republicano monumento arquitectura civil histórico palacio municipalidad", "arquitectonico"),
    ("vivienda vernácula adobe tapial quincha construcción tradicional andina", "arquitectonico"),
    ("hacienda casona colonial estancia fundo arquitectura rural histórica", "arquitectonico"),

    # natural
    ("lago laguna totora fauna flora ecosistema humedal bofedal reserva natural", "natural"),
    ("nevado montaña apus sagrado cerro glaciar puna cordillera andes", "natural"),
    ("bosque primario árbol milenario selva alta biodiversidad flora fauna endémica", "natural"),
    ("paisaje cultural agrario andén terraza irrigación canal hidráulico", "natural"),
]


class ClasificadorPatrimonio:
    """
    Clasificador de tipo de patrimonio cultural usando TF-IDF + Regresión Logística.
    Opera sobre texto libre (nombre + descripción del bien cultural).
    """

    MODEL_FILE = 'clasificador_patrimonio.joblib'
    ENCODER_FILE = 'label_encoder.joblib'

    def __init__(self):
        self.model_path   = settings.ML_MODELS_DIR / self.MODEL_FILE
        self.encoder_path = settings.ML_MODELS_DIR / self.ENCODER_FILE
        self.pipeline     = None
        self.encoder      = None
        self._cargar_o_entrenar()

    def _cargar_o_entrenar(self):
        """Carga el modelo existente o entrena uno nuevo si no existe."""
        if self.model_path.exists() and self.encoder_path.exists():
            self.pipeline = joblib.load(self.model_path)
            self.encoder  = joblib.load(self.encoder_path)
        else:
            self.entrenar()

    def entrenar(self, datos_extra: list = None):
        """
        Entrena el clasificador con los datos base + datos extra opcionales.
        datos_extra: lista de tuplas (texto, tipo)
        """
        datos = DATOS_ENTRENAMIENTO.copy()
        if datos_extra:
            datos.extend(datos_extra)

        textos = [d[0] for d in datos]
        tipos  = [d[1] for d in datos]

        self.encoder = LabelEncoder()
        y = self.encoder.fit_transform(tipos)

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                analyzer='word',
                ngram_range=(1, 2),
                min_df=1,
                max_features=5000,
                strip_accents='unicode',
                lowercase=True,
            )),
            ('clf', LogisticRegression(
                max_iter=1000,
                C=1.0,
                solver='lbfgs',
                multi_class='multinomial',
            )),
        ])

        self.pipeline.fit(textos, y)

        # Persistir modelos
        joblib.dump(self.pipeline, self.model_path)
        joblib.dump(self.encoder,  self.encoder_path)

        return {'entrenado': True, 'muestras': len(datos), 'clases': list(self.encoder.classes_)}

    def clasificar(self, nombre: str, descripcion: str) -> dict:
        """
        Clasifica un bien cultural dado su nombre y descripción.
        Retorna el tipo predicho con probabilidades por clase.
        """
        texto = f"{nombre} {descripcion}".lower()
        proba = self.pipeline.predict_proba([texto])[0]
        clases = self.encoder.classes_

        # Construir ranking de probabilidades
        ranking = sorted(
            [{'tipo': cls, 'confianza': round(float(p), 4)} for cls, p in zip(clases, proba)],
            key=lambda x: x['confianza'],
            reverse=True,
        )

        tipo_predicho  = ranking[0]['tipo']
        confianza_max  = ranking[0]['confianza']

        return {
            'tipo_predicho':  tipo_predicho,
            'confianza':      confianza_max,
            'nivel_confianza': self._nivel(confianza_max),
            'probabilidades': ranking,
        }

    def _nivel(self, confianza: float) -> str:
        if confianza >= 0.80:
            return 'alto'
        if confianza >= 0.50:
            return 'medio'
        return 'bajo'


# Singleton — se instancia una vez al arrancar el servicio
_clasificador_instance = None

def get_clasificador() -> ClasificadorPatrimonio:
    global _clasificador_instance
    if _clasificador_instance is None:
        _clasificador_instance = ClasificadorPatrimonio()
    return _clasificador_instance
