from django.urls import path, include

urlpatterns = [
    path('api/ia/', include('app.api.urls')),
    path('health/', include('app.api.health')),
]