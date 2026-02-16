import json
import asyncio
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from analyzer.models import CodeFile
# Import the analyzer functions
from analyzer.control_flow import analyze_code, generate_control_flow

logger = logging.getLogger(__name__)
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
import json
import requests
import os
import tempfile
from datetime import datetime
from analyzer.core import StaticAnalyzer
from analyzer.models import Project, CodeFile, AnalysisReport, Issue, Metric
from .serializers import (
    ProjectSerializer, CodeFileSerializer, AnalysisReportSerializer,
    IssueSerializer, MetricSerializer
)
import asyncio
import time
from asgiref.sync import sync_to_async

try:
    import nest_asyncio
    NEST_ASYNCIO_AVAILABLE = True
except ImportError:
    NEST_ASYNCIO_AVAILABLE = False

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        """Trigger analysis for a project"""
        project = self.get_object()
        
        # Create new analysis report
        report = AnalysisReport.objects.create(
            project=project,
            status='running',
            total_files=project.files.count()
        )
        
        try:
            analyzer = StaticAnalyzer()
            total_issues = 0
            total_lines = 0
            
            # Analyze each file in the project
            for code_file in project.files.all():
                analysis_result = analyzer.analyze_file(
                    code_file.file_path,
                    code_file.content,
                    code_file.language
                )
                
                # Save metrics
                metrics_data = analysis_result.get('metrics', {})
                for metric_type, value in metrics_data.items():
                    Metric.objects.create(
                        report=report,
                        file=code_file,
                        metric_type=metric_type,
                        value=value
                    )
                
                # Save issues
                for issue_data in analysis_result.get('issues', []):
                    Issue.objects.create(
                        report=report,
                        file=code_file,
                        rule_id=issue_data['rule_id'],
                        rule_name=issue_data['rule_name'],
                        severity=issue_data['severity'],
                        category=issue_data['category'],
                        message=issue_data['message'],
                        line_number=issue_data['line_number'],
                        column_number=issue_data.get('column_number', 0),
                        suggestion=issue_data.get('suggestion', '')
                    )
                    total_issues += 1
                
                total_lines += metrics_data.get('lines_of_code', 0)
            
            # Update report with final statistics
            report.status = 'completed'
            report.total_lines = total_lines
            report.total_issues = total_issues
            report.critical_issues = report.issues.filter(severity='critical').count()
            report.major_issues = report.issues.filter(severity='major').count()
            report.minor_issues = report.issues.filter(severity='minor').count()
            report.save()
            
            return Response({
                'message': 'Analysis completed successfully',
                'report_id': str(report.id),
                'total_issues': total_issues,
                'total_lines': total_lines
            })
            
        except Exception as e:
            report.status = 'failed'
            report.save()
            return Response(
                {'error': f'Analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CodeFileViewSet(viewsets.ModelViewSet):
    queryset = CodeFile.objects.all()
    serializer_class = CodeFileSerializer
    
    def get_queryset(self):
        queryset = CodeFile.objects.all()
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

class AnalysisReportViewSet(viewsets.ModelViewSet):
    queryset = AnalysisReport.objects.all()
    serializer_class = AnalysisReportSerializer
    
    def get_queryset(self):
        queryset = AnalysisReport.objects.select_related('project').prefetch_related('issues').all()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by('-started_at')

class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    
    def get_queryset(self):
        queryset = Issue.objects.all()
        report_id = self.request.query_params.get('report', None)
        severity = self.request.query_params.get('severity', None)
        category = self.request.query_params.get('category', None)
        
        project_id = self.request.query_params.get('project', None)

        if report_id:
            queryset = queryset.filter(report_id=report_id)
        elif project_id:
            queryset = queryset.filter(report__project_id=project_id)
        if severity:
            queryset = queryset.filter(severity=severity)
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset.order_by('-severity', 'line_number')

class AnalyzeCodeView(APIView):
    """Analyze code snippet directly"""
    
    def post(self, request):
        code = request.data.get('code', '')
        language = request.data.get('language', 'python')
        filename = request.data.get('filename', 'temp_file')
        
        if not code:
            return Response(
                {
                    'status': 'error',
                    'error': 'Code content is required',
                    'details': 'No code was provided for analysis'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            analyzer = StaticAnalyzer()
            result = analyzer.analyze_file(filename, code, language)
            
            # Ensure the result has the required fields
            if not isinstance(result, dict):
                result = {'file_path': filename, 'language': language, 'metrics': {}, 'issues': []}
            
            return Response({
                'status': 'success',
                'data': {
                    'file_path': result.get('file_path', filename),
                    'language': result.get('language', language),
                    'metrics': result.get('metrics', {
                        'lines_of_code': 0,
                        'cyclomatic_complexity': 0,
                    }),
                    'issues': result.get('issues', [])
                }
            })
            
        except Exception as e:
            logger.error(f'Error analyzing code: {str(e)}', exc_info=True)
            return Response(
                {
                    'status': 'error',
                    'error': 'Analysis failed',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileUploadView(APIView):
    """Upload and analyze files"""
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        # Debug: Log the request data and files
        print("Request data:", request.data)
        print("Request FILES:", request.FILES)
        
        project_name = request.data.get('project_name', 'Uploaded Project')
        project_id = request.data.get('project_id')
        
        # Handle both single file and multiple files
        if 'files' in request.FILES:
            files = request.FILES.getlist('files')
        elif 'file' in request.FILES:  # Fallback to 'file' if 'files' is not present
            files = [request.FILES['file']]
        else:
            # Try to get any file if neither 'files' nor 'file' is present
            files = list(request.FILES.values()) if request.FILES else []
        
        print(f"Found {len(files)} files in request")
        
        if not files:
            return Response(
                {
                    'error': 'No files provided',
                    'received_files': list(request.FILES.keys()) if request.FILES else 'No files in request',
                    'request_data': dict(request.data)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth.models import User
            user = User.objects.first()
            if not user:
                user = User.objects.create_user('admin', 'admin@example.com', 'admin123')
            
            # Check if we're adding to an existing project
            if project_id:
                try:
                    project = Project.objects.get(id=project_id)
                except Project.DoesNotExist:
                    project = None
            else:
                project = None
                
            # Create new project if not adding to existing one
            if not project:
                project = Project.objects.create(
                    name=project_name,
                    description=f'Project created from file upload',
                    owner=user
                )
            
            analyzer = StaticAnalyzer()
            uploaded_files = []
            
            for uploaded_file in files:
                # Read file content
                content = uploaded_file.read().decode('utf-8')
                
                # Detect language
                file_path = uploaded_file.name
                from pathlib import Path
                language = analyzer._detect_language(Path(file_path))
                
                if not language:
                    continue
                
                # Create CodeFile record
                code_file = CodeFile.objects.create(
                    project=project,
                    filename=uploaded_file.name,
                    file_path=file_path,
                    language=language,
                    content=content,
                    size_bytes=len(content.encode('utf-8')),
                    lines_of_code=len([line for line in content.split('\n') if line.strip()])
                )
                
                uploaded_files.append({
                    'id': str(code_file.id),
                    'filename': code_file.filename,
                    'language': code_file.language,
                    'lines_of_code': code_file.lines_of_code
                })
            
            return Response({
                'project_id': str(project.id),
                'project_name': project.name,
                'files': uploaded_files,
                'message': f'Successfully uploaded {len(uploaded_files)} files'
            })
            
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@csrf_exempt
def control_flow_analysis(request):
    """Generate control flow diagram for Python code using FastControlFlowAnalyzer"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        code = data.get('code', '').strip()
        function_name = data.get('function_name', '').strip() or None
        
        if not code:
            return JsonResponse(
                {'error': 'No code provided'}, 
                status=400
            )
        
        # Use the enhanced control flow analyzer
        from analyzer.enhanced_control_flow import analyze_control_flow as enhanced_analyze_control_flow
        result = enhanced_analyze_control_flow(code, function_name)
        
        if result.get('status') == 'error':
            return JsonResponse(
                {'error': result.get('error', 'Unknown error')}, 
                status=400
            )
            
        return JsonResponse(result)
        
    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'Invalid JSON data'}, 
            status=400
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse(
            {'error': f'Error analyzing code: {str(e)}'}, 
            status=500
        )


class CodeFileViewSet(viewsets.ModelViewSet):
    queryset = CodeFile.objects.all()
    serializer_class = CodeFileSerializer
    
    @action(detail=True, methods=['post'])
    def control_flow(self, request, pk=None):
        """Generate control flow diagram for a specific code file"""
        try:
            # Get the code file or return 404 if not found
            try:
                code_file = self.get_object()
            except CodeFile.DoesNotExist:
                logger.warning(f'Code file with id {pk} not found')
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            function_name = request.data.get('function_name')
            
            # Validate file content
            if not code_file.content:
                logger.warning(f'Empty file content for file id: {pk}')
                return Response(
                    {'error': 'File is empty'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if it's a Python file
            if not code_file.filename.lower().endswith('.py'):
                logger.warning(f'Non-Python file attempted for analysis: {code_file.filename}')
                return Response(
                    {'error': 'Control flow analysis is only supported for Python files'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Apply nest_asyncio if available
            if NEST_ASYNCIO_AVAILABLE:
                nest_asyncio.apply()
            
            logger.info(f'Starting control flow analysis for file: {code_file.filename}, function: {function_name or "<all>"}')
            
            try:
                # Use the enhanced control flow analyzer
                result = enhanced_analyze_control_flow(code_file.content, function_name)
                
                if result.get('status') == 'error':
                    error_msg = result.get('error', 'Unknown error during analysis')
                    logger.error(f'Control flow analysis failed: {error_msg}')
                    return Response(
                        {'error': error_msg},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Add file information to result
                result['file_info'] = {
                    'id': str(code_file.id),
                    'filename': code_file.filename,
                    'language': code_file.language,
                    'lines_of_code': code_file.lines_of_code,
                    'size': len(code_file.content.encode('utf-8')),
                    'line_count': len(code_file.content.splitlines())
                }
                
                logger.info(f'Successfully generated control flow for file: {code_file.filename}')
                return Response(result)
                
            except asyncio.CancelledError:
                logger.warning('Control flow analysis was cancelled')
                return Response(
                    {'error': 'Analysis was cancelled'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                logger.exception('Error during control flow analysis')
                return Response(
                    {'error': f'Error during analysis: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except json.JSONDecodeError:
            logger.error('Invalid JSON in request data')
            return Response(
                {'error': 'Invalid JSON data'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception('Unexpected error in control_flow endpoint')
            return Response(
                {'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from rest_framework.decorators import api_view

@api_view(['POST'])
def diagram_generation(request):
    code = request.data.get('code', '')
    if not code:
        return HttpResponse('No code provided', status=400)
    
    html_content = generate_control_flow(code)
    return HttpResponse(html_content, content_type='text/html')

@api_view(['POST'])
def analyze_code_complexity(request):
    """Analyzes code for complexity and control flow."""
    try:
        code = request.data.get('code', '')
        if not code:
            return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Use the newly integrated analysis function
        analysis_result = analyze_code(code)

        if analysis_result.get("errors"):
            # Return a 400 status if there are syntax or analysis errors
            return Response({
                'status': 'error',
                'error': 'Failed to analyze code.',
                'details': analysis_result['errors']
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response(analysis_result)

    except Exception as e:
        logger.error(f'Error in analyze_code_complexity view: {str(e)}', exc_info=True)
        return Response(
            {'error': f'An unexpected error occurred on the server: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class MobSFAnalyzer:
    """
    Handle APK analysis using MobSF API
    """
    
    def __init__(self, api_key=None, base_url=None):
        # Use environment variables with proper defaults for MobSF
        self.api_key = api_key or os.getenv('MOBSF_API_KEY', 'your_mobsf_api_key_here')
        # Default to MobSF running on port 8001 (different from Django on 8000)
        # If MOBSF_BASE_URL is not set, try common MobSF ports
        if not base_url and not os.getenv('MOBSF_BASE_URL'):
            # Try different common MobSF ports
            for port in [8001, 8080, 8090]:
                try:
                    test_url = f"http://localhost:{port}"
                    response = requests.get(f"{test_url}/api/v1/scans", timeout=2)
                    if response.status_code == 200:
                        base_url = test_url
                        break
                except:
                    continue
        
        self.base_url = base_url or os.getenv('MOBSF_BASE_URL', 'http://localhost:8001')
        self.headers = {
            'Authorization': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def upload_apk(self, file_path):
        """Upload APK file to MobSF"""
        url = f"{self.base_url}/api/v1/upload"
        
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'application/octet-stream')}
            headers = {'Authorization': self.api_key}
            
            response = requests.post(url, files=files, headers=headers)
            response.raise_for_status()
            return response.json()
    
    def start_analysis(self, file_hash, file_name):
        """Start static analysis"""
        url = f"{self.base_url}/api/v1/scan"
        data = {
            'hash': file_hash,
            'scan_type': 'apk',
            'file_name': file_name
        }
        
        response = requests.post(url, data=data, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_report(self, file_hash):
        """Get analysis report"""
        url = f"{self.base_url}/api/v1/report_json"
        data = {'hash': file_hash}
        
        response = requests.post(url, data=data, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def download_pdf(self, file_hash, output_path):
        """Download PDF report"""
        url = f"{self.base_url}/api/v1/download_pdf"
        data = {'hash': file_hash}
        
        response = requests.post(url, data=data, headers=self.headers)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return output_path
    
    def get_scan_logs(self, file_hash):
        """Get scan logs"""
        url = f"{self.base_url}/api/v1/scans"
        
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        scans = response.json()
        for scan in scans:
            if scan.get('MD5') == file_hash:
                return scan
        
        return None


class APKAnalysisView(APIView):
    """Handle APK file upload and analysis using MobSF"""
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({'error': 'No APK file provided'}, status=400)
        
        apk_file = request.FILES['file']
        
        # Validate file extension
        if not apk_file.name.lower().endswith('.apk'):
            return Response({'error': 'Only APK files are supported'}, status=400)
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.apk') as tmp_file:
            for chunk in apk_file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name
        
        try:
            # Initialize MobSF analyzer
            mobsf = MobSFAnalyzer()
            
            # Upload APK to MobSF
            upload_result = mobsf.upload_apk(tmp_file_path)
            file_hash = upload_result.get('hash')
            file_name = upload_result.get('file_name', apk_file.name)
            
            if not file_hash:
                return Response({'error': 'Failed to upload APK to MobSF'}, status=500)
            
            # Start analysis
            analysis_result = mobsf.start_analysis(file_hash, file_name)
            
            # Poll for completion (with timeout)
            max_attempts = 30  # 1 minute timeout
            for attempt in range(max_attempts):
                try:
                    report = mobsf.get_report(file_hash)
                    if report and 'error' not in report:
                        break
                except:
                    pass
                time.sleep(2)
            else:
                return Response({'error': 'Analysis timeout - please try again later'}, status=408)
            
            # Process and format the report
            formatted_report = self._format_mobsf_report(report, file_name, file_hash)
            
            return Response({
                'status': 'success',
                'file_name': file_name,
                'file_hash': file_hash,
                'report': formatted_report
            })
            
        except requests.exceptions.RequestException as e:
            return Response({'error': f'MobSF API error: {str(e)}'}, status=500)
        except Exception as e:
            return Response({'error': f'Analysis failed: {str(e)}'}, status=500)
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_file_path)
            except:
                pass
    
    def _format_mobsf_report(self, mobsf_report, file_name, file_hash):
        """Format MobSF report to match our frontend expectations"""
        
        # Extract basic app info
        app_info = mobsf_report.get('app_info', {})
        
        # Extract security issues
        security_issues = []
        
        # Process code analysis issues
        code_analysis = mobsf_report.get('code_analysis', {})
        for category, issues in code_analysis.items():
            if isinstance(issues, list):
                for issue in issues:
                    security_issues.append({
                        'title': issue.get('title', category),
                        'severity': self._map_severity(issue.get('severity', 'info')),
                        'description': issue.get('description', ''),
                        'recommendation': issue.get('recommendation', ''),
                        'file': issue.get('file', ''),
                        'line': issue.get('line', 0)
                    })
        
        # Process manifest analysis issues
        manifest_analysis = mobsf_report.get('manifest_analysis', {})
        for category, issues in manifest_analysis.items():
            if isinstance(issues, list):
                for issue in issues:
                    security_issues.append({
                        'title': issue.get('title', category),
                        'severity': self._map_severity(issue.get('severity', 'info')),
                        'description': issue.get('description', ''),
                        'recommendation': issue.get('recommendation', ''),
                        'file': 'AndroidManifest.xml',
                        'line': 0
                    })
        
        # Calculate security score (simplified)
        total_issues = len(security_issues)
        high_issues = len([i for i in security_issues if i['severity'] == 'high'])
        medium_issues = len([i for i in security_issues if i['severity'] == 'medium'])
        
        # Simple scoring algorithm
        security_score = max(0, 100 - (high_issues * 20) - (medium_issues * 10) - (total_issues * 2))
        
        return {
            'file_name': file_name,
            'file_hash': file_hash,
            'package_name': app_info.get('package_name', ''),
            'version_name': app_info.get('version_name', ''),
            'version_code': str(app_info.get('version_code', '')),
            'sdk_version': {
                'min_sdk': str(app_info.get('min_sdk', '')),
                'target_sdk': str(app_info.get('target_sdk', '')),
                'max_sdk': str(app_info.get('max_sdk', ''))
            },
            'permissions': mobsf_report.get('permissions', []),
            'activities': mobsf_report.get('activities', []),
            'services': mobsf_report.get('services', []),
            'receivers': mobsf_report.get('receivers', []),
            'providers': mobsf_report.get('providers', []),
            'security_score': security_score,
            'security_issues': security_issues,
            'code_analysis': code_analysis,
            'file_analysis': mobsf_report.get('file_analysis', {}),
            'manifest_analysis': manifest_analysis,
            'created_at': datetime.now().isoformat()
        }
    
    def _map_severity(self, mobsf_severity):
        """Map MobSF severity levels to our standard levels"""
        severity_map = {
            'high': 'high',
            'warning': 'medium',
            'info': 'low',
            'secure': 'info'
        }
        return severity_map.get(mobsf_severity.lower(), 'info')


class APKAnalysisView(APIView):
    """Handle APK file upload and analysis using MobSF"""
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({'error': 'No APK file provided'}, status=400)
        
        apk_file = request.FILES['file']
        
        # Validate file extension
        if not apk_file.name.lower().endswith('.apk'):
            return Response({'error': 'Only APK files are supported'}, status=400)
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.apk') as tmp_file:
            for chunk in apk_file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name
        
        try:
            # Initialize MobSF analyzer
            mobsf = MobSFAnalyzer()
            
            # Upload APK to MobSF
            upload_result = mobsf.upload_apk(tmp_file_path)
            file_hash = upload_result.get('hash')
            file_name = upload_result.get('file_name', apk_file.name)
            
            if not file_hash:
                return Response({'error': 'Failed to upload APK to MobSF'}, status=500)
            
            # Start analysis
            analysis_result = mobsf.start_analysis(file_hash, file_name)
            
            # Poll for completion (with timeout)
            max_attempts = 30  # 1 minute timeout
            for attempt in range(max_attempts):
                try:
                    report = mobsf.get_report(file_hash)
                    if report and 'error' not in report:
                        break
                except:
                    pass
                time.sleep(2)
            else:
                return Response({'error': 'Analysis timeout - please try again later'}, status=408)
            
            # Process and format the report
            formatted_report = self._format_mobsf_report(report, file_name, file_hash)
            
            return Response({
                'status': 'success',
                'file_name': file_name,
                'file_hash': file_hash,
                'report': formatted_report
            })
            
        except requests.exceptions.RequestException as e:
            return Response({'error': f'MobSF API error: {str(e)}'}, status=500)
        except Exception as e:
            return Response({'error': f'Analysis failed: {str(e)}'}, status=500)
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_file_path)
            except:
                pass
    
    def _format_mobsf_report(self, mobsf_report, file_name, file_hash):
        """Format MobSF report to match our frontend expectations"""
        
        # Extract basic app info
        app_info = mobsf_report.get('app_info', {})
        
        # Extract security issues
        security_issues = []
        
        # Process code analysis issues
        code_analysis = mobsf_report.get('code_analysis', {})
        for category, issues in code_analysis.items():
            if isinstance(issues, list):
                for issue in issues:
                    security_issues.append({
                        'title': issue.get('title', category),
                        'severity': self._map_severity(issue.get('severity', 'info')),
                        'description': issue.get('description', ''),
                        'recommendation': issue.get('recommendation', ''),
                        'file': issue.get('file', ''),
                        'line': issue.get('line', 0)
                    })
        
        # Process manifest analysis issues
        manifest_analysis = mobsf_report.get('manifest_analysis', {})
        for category, issues in manifest_analysis.items():
            if isinstance(issues, list):
                for issue in issues:
                    security_issues.append({
                        'title': issue.get('title', category),
                        'severity': self._map_severity(issue.get('severity', 'info')),
                        'description': issue.get('description', ''),
                        'recommendation': issue.get('recommendation', ''),
                        'file': 'AndroidManifest.xml',
                        'line': 0
                    })
        
        # Calculate security score (simplified)
        total_issues = len(security_issues)
        high_issues = len([i for i in security_issues if i['severity'] == 'high'])
        medium_issues = len([i for i in security_issues if i['severity'] == 'medium'])
        
        # Simple scoring algorithm
        security_score = max(0, 100 - (high_issues * 20) - (medium_issues * 10) - (total_issues * 2))
        
        return {
            'file_name': file_name,
            'file_hash': file_hash,
            'package_name': app_info.get('package_name', ''),
            'version_name': app_info.get('version_name', ''),
            'version_code': str(app_info.get('version_code', '')),
            'sdk_version': {
                'min_sdk': str(app_info.get('min_sdk', '')),
                'target_sdk': str(app_info.get('target_sdk', '')),
                'max_sdk': str(app_info.get('max_sdk', ''))
            },
            'permissions': mobsf_report.get('permissions', []),
            'activities': mobsf_report.get('activities', []),
            'services': mobsf_report.get('services', []),
            'receivers': mobsf_report.get('receivers', []),
            'providers': mobsf_report.get('providers', []),
            'security_score': security_score,
            'security_issues': security_issues,
            'code_analysis': code_analysis,
            'file_analysis': mobsf_report.get('file_analysis', {}),
            'manifest_analysis': manifest_analysis,
            'created_at': datetime.now().isoformat()
        }
    
    def _map_severity(self, mobsf_severity):
        """Map MobSF severity levels to our standard levels"""
        severity_map = {
            'high': 'high',
            'warning': 'medium',
            'info': 'low',
            'secure': 'info'
        }
        return severity_map.get(mobsf_severity.lower(), 'info')
