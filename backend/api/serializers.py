from rest_framework import serializers
from analyzer.models import Project, CodeFile, AnalysisReport, Issue, Metric

class ProjectSerializer(serializers.ModelSerializer):
    files_count = serializers.SerializerMethodField()
    latest_report = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'created_at', 'updated_at', 'files_count', 'latest_report']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Auto-assign owner to first available user or create one
        from django.contrib.auth.models import User
        user = User.objects.first()
        if not user:
            user = User.objects.create_user('admin', 'admin@example.com', 'admin123')
        validated_data['owner'] = user
        return super().create(validated_data)
    
    def get_files_count(self, obj):
        return obj.files.count()
    
    def get_latest_report(self, obj):
        latest = obj.reports.order_by('-started_at').first()
        if latest:
            return AnalysisReportSerializer(latest).data
        return None

class CodeFileSerializer(serializers.ModelSerializer):
    issues_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CodeFile
        fields = ['id', 'project', 'filename', 'file_path', 'language', 'content', 
                 'size_bytes', 'lines_of_code', 'created_at', 'updated_at', 'issues_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_issues_count(self, obj):
        return obj.issues.count()

class AnalysisReportSerializer(serializers.ModelSerializer):
    issues_by_severity = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = AnalysisReport
        fields = ['id', 'project', 'status', 'total_files', 'total_lines', 'total_issues',
                 'critical_issues', 'major_issues', 'minor_issues', 'complexity_score',
                 'maintainability_index', 'test_coverage', 'started_at', 'completed_at',
                 'issues_by_severity', 'duration']
        read_only_fields = ['id', 'started_at']
    
    def get_issues_by_severity(self, obj):
        return {
            'critical': obj.critical_issues,
            'major': obj.major_issues,
            'minor': obj.minor_issues,
            'info': obj.issues.filter(severity='info').count()
        }
    
    def get_duration(self, obj):
        if obj.completed_at and obj.started_at:
            return (obj.completed_at - obj.started_at).total_seconds()
        return None

class IssueSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.filename', read_only=True)
    
    class Meta:
        model = Issue
        fields = ['id', 'report', 'file', 'file_name', 'rule_id', 'rule_name', 'severity',
                 'category', 'message', 'line_number', 'column_number', 'code_snippet', 'suggestion']
        read_only_fields = ['id']

class MetricSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.filename', read_only=True)
    
    class Meta:
        model = Metric
        fields = ['id', 'report', 'file', 'file_name', 'metric_type', 'value', 'threshold', 'passed']
        read_only_fields = ['id']
