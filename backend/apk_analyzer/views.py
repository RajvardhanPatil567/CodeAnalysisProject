import os
import logging
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .services import apk_analyzer

logger = logging.getLogger(__name__)

class APKAnalysisView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        """Handle APK file upload and start analysis"""
        if 'file' not in request.FILES:
            return Response(
                {"error": "No file provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file_obj = request.FILES['file']
        
        try:
            # 1. Upload the file to MobSF
            upload_result = apk_analyzer.upload_file(file_obj)
            
            # 2. Start the scan with the returned hash
            scan_result = apk_analyzer.scan_file(
                file_hash=upload_result['hash'],
                scan_type=request.data.get('scan_type', 'apk')
            )
            
            # 3. Get the scan results (this will wait for the scan to complete)
            # Note: In a real implementation, you might want to make this asynchronous
            # and use a task queue like Celery to handle the scanning process
            
            return Response({
                "status": "success",
                "file_name": upload_result['file_name'],
                "file_hash": upload_result['hash'],
                "scan_type": upload_result['scan_type'],
                "message": "Analysis completed successfully"
            })
            
        except Exception as e:
            logger.error(f"APK analysis failed: {str(e)}", exc_info=True)
            return Response(
                {"error": f"APK analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class APKScanStatusView(APIView):
    def get(self, request, file_hash):
        """Get scan status and results"""
        try:
            result = apk_analyzer.get_scan_results(file_hash)
            return Response(result)
        except Exception as e:
            logger.error(f"Failed to get scan results: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to get scan results: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class APKScanLogsView(APIView):
    def get(self, request, file_hash):
        """Get scan logs"""
        try:
            logs = apk_analyzer.get_scan_logs(file_hash)
            return Response(logs)
        except Exception as e:
            logger.error(f"Failed to get scan logs: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to get scan logs: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class APKPDFReportView(APIView):
    def get(self, request, file_hash):
        """Download PDF report"""
        try:
            pdf_content = apk_analyzer.download_pdf_report(file_hash)
            response = Response(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="apk_report_{file_hash}.pdf"'
            return response
        except Exception as e:
            logger.error(f"Failed to download PDF report: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Failed to download PDF report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
