from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from apk_analyzer.views import (
    APKAnalysisView,
    APKScanStatusView,
    APKScanLogsView,
    APKPDFReportView
)

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet)
router.register(r'files', views.CodeFileViewSet)
router.register(r'reports', views.AnalysisReportViewSet)
router.register(r'issues', views.IssueViewSet)

apk_patterns = [
    path('analyze/', APKAnalysisView.as_view(), name='apk-analyze'),
    path('scan/<str:file_hash>/', APKScanStatusView.as_view(), name='apk-scan-status'),
    path('scan/<str:file_hash>/logs/', APKScanLogsView.as_view(), name='apk-scan-logs'),
    path('scan/<str:file_hash>/report/', APKPDFReportView.as_view(), name='apk-pdf-report'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('analyze/', views.AnalyzeCodeView.as_view(), name='analyze-code'),
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),
    path('control-flow/', views.control_flow_analysis, name='control-flow'),
    path('diagram/', views.diagram_generation, name='diagram-generation'),
    path('apk/', include(apk_patterns)),
]
