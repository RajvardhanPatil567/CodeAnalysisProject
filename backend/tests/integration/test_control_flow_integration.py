import json
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from analyzer.models import CodeFile

@pytest.mark.django_db
class TestControlFlowIntegration:
    @pytest.fixture
    def api_client(self):
        return APIClient()

    def test_control_flow_analysis_full_stack(self, api_client):
        """Test the full stack control flow analysis"""
        # 1. Upload a Python file
        code_content = """
def calculate_stats(numbers):
    total = 0
    count = 0
    for num in numbers:
        if num > 0:
            total += num
            count += 1
    return total / count if count > 0 else 0
        """
        
        # 2. Create a code file in the database
        code_file = CodeFile.objects.create(
            name="stats.py",
            content=code_content,
            language="python"
        )
        
        # 3. Call the control flow API
        url = reverse('control_flow_analysis')
        response = api_client.post(
            url,
            data=json.dumps({
                'code': code_content,
                'function_name': 'calculate_stats'
            }),
            content_type='application/json'
        )
        
        # 4. Verify the response
        assert response.status_code == 200
        data = response.json()
        assert 'nodes' in data
        assert 'edges' in data
        assert 'html' in data
        
        # Verify some expected nodes are present
        node_labels = [node['label'].lower() for node in data['nodes']]
        assert any('for' in label for label in node_labels)
        assert any('if' in label for label in node_labels)
        assert any('return' in label for label in node_labels)
        
        # Verify the graph structure
        assert len(data['nodes']) >= 5  # Should have several nodes
        assert len(data['edges']) >= 4   # Should have several edges
