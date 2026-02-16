from django.db import models
from django.contrib.auth.models import User
import uuid

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class CodeFile(models.Model):
    LANGUAGE_CHOICES = [
        ('python', 'Python'),
        ('javascript', 'JavaScript'),
        ('typescript', 'TypeScript'),
        ('java', 'Java'),
        ('cpp', 'C++'),
        ('c', 'C'),
        ('go', 'Go'),
        ('rust', 'Rust'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    filename = models.CharField(max_length=255)
    file_path = models.TextField()
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    content = models.TextField()
    size_bytes = models.IntegerField()
    lines_of_code = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.project.name}/{self.filename}"

class AnalysisReport(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='reports')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_files = models.IntegerField(default=0)
    total_lines = models.IntegerField(default=0)
    total_issues = models.IntegerField(default=0)
    critical_issues = models.IntegerField(default=0)
    major_issues = models.IntegerField(default=0)
    minor_issues = models.IntegerField(default=0)
    complexity_score = models.FloatField(default=0.0)
    maintainability_index = models.FloatField(default=0.0)
    test_coverage = models.FloatField(default=0.0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Analysis Report for {self.project.name} - {self.status}"

class Issue(models.Model):
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('major', 'Major'),
        ('minor', 'Minor'),
        ('info', 'Info'),
    ]
    
    CATEGORY_CHOICES = [
        ('security', 'Security'),
        ('performance', 'Performance'),
        ('maintainability', 'Maintainability'),
        ('reliability', 'Reliability'),
        ('style', 'Code Style'),
        ('complexity', 'Complexity'),
        ('duplication', 'Code Duplication'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(AnalysisReport, on_delete=models.CASCADE, related_name='issues')
    file = models.ForeignKey(CodeFile, on_delete=models.CASCADE, related_name='issues')
    rule_id = models.CharField(max_length=100)
    rule_name = models.CharField(max_length=255)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    message = models.TextField()
    line_number = models.IntegerField()
    column_number = models.IntegerField(default=0)
    code_snippet = models.TextField(blank=True)
    suggestion = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.severity.upper()}: {self.rule_name} in {self.file.filename}:{self.line_number}"

class Metric(models.Model):
    METRIC_TYPES = [
        ('cyclomatic_complexity', 'Cyclomatic Complexity'),
        ('halstead_complexity', 'Halstead Complexity'),
        ('maintainability_index', 'Maintainability Index'),
        ('lines_of_code', 'Lines of Code'),
        ('code_duplication', 'Code Duplication'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(AnalysisReport, on_delete=models.CASCADE, related_name='metrics')
    file = models.ForeignKey(CodeFile, on_delete=models.CASCADE, related_name='metrics', null=True, blank=True)
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    value = models.FloatField()
    threshold = models.FloatField(null=True, blank=True)
    passed = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.metric_type}: {self.value}"
