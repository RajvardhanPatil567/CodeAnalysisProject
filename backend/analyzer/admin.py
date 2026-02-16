from django.contrib import admin
from .models import Project, CodeFile, AnalysisReport, Issue, Metric

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at', 'files_count']
    list_filter = ['created_at', 'owner']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def files_count(self, obj):
        return obj.files.count()
    files_count.short_description = 'Files'

@admin.register(CodeFile)
class CodeFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'project', 'language', 'lines_of_code', 'size_bytes']
    list_filter = ['language', 'created_at']
    search_fields = ['filename', 'file_path']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(AnalysisReport)
class AnalysisReportAdmin(admin.ModelAdmin):
    list_display = ['project', 'status', 'total_issues', 'started_at', 'completed_at']
    list_filter = ['status', 'started_at']
    readonly_fields = ['id', 'started_at']

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ['rule_name', 'severity', 'category', 'file', 'line_number']
    list_filter = ['severity', 'category', 'report__project']
    search_fields = ['rule_name', 'message', 'file__filename']

@admin.register(Metric)
class MetricAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'value', 'file', 'passed']
    list_filter = ['metric_type', 'passed', 'report__project']
