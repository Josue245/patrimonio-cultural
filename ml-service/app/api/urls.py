from django.urls import path
from . import views

urlpatterns = [
    path('clasificar/',          views.ClasificarPatrimonioView.as_view(),   name='clasificar'),
    path('analizar/',            views.AnalizarBienView.as_view(),            name='analizar'),
    path('similar/',             views.PatrimonioSimilarView.as_view(),       name='similar'),
    path('detectar-duplicado/',  views.DetectarDuplicadosView.as_view(),      name='duplicados'),
    path('generar-descripcion/', views.GenerarDescripcionView.as_view(),      name='generar-descripcion'),
    path('entrenar/',            views.EntrenarModeloView.as_view(),          name='entrenar'),
    path('estadisticas-ia/',     views.EstadisticasIAView.as_view(),          name='estadisticas-ia'),
    path('estado/',              views.EstadoView.as_view(),                  name='estado'),
]