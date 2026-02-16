import os
import requests
import json
import logging
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

class APKAnalyzer:
    """Client for interacting with the MobSF API."""
    
    # Default values
    BASE_URL = 'http://localhost:8000'
    API_VERSION = 'v1'  # Using v1 as per the API documentation
    API_KEY = '1d0f9f1d8d09c46e171a9eb9e48a15d53e021bdcd07ac7fe31f4184dff3477af'
    VERIFY_SSL = False
    
    def __init__(self, mobsf_url=None, api_key=None, verify_ssl=None):
        """Initialize the APKAnalyzer with optional custom settings."""
        if mobsf_url:
            self.BASE_URL = mobsf_url.rstrip('/')
        if api_key:
            self.API_KEY = api_key
        if verify_ssl is not None:
            self.VERIFY_SSL = verify_ssl
            
        self.timeout = 30  # seconds
        
        if not self.API_KEY:
            logger.warning('MobSF API key not configured.')
            logger.warning('MobSF API key not configured. Set MOBSF_API_KEY in settings.')
            
        self.headers = {
            "Authorization": self.API_KEY,
            "Content-Type": "application/json"
        }
        
        # Configure requests session
        self.session = requests.Session()
        self.session.verify = self.VERIFY_SSL
        if not self.VERIFY_SSL:
            # Disable SSL warnings for self-signed certificates
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    def _make_request(self, method, endpoint, **kwargs):
        """Helper method to make HTTP requests with error handling"""
        # Construct the full API URL with version
        base_url = f"{self.BASE_URL.rstrip('/')}/api/{self.API_VERSION}/"
        url = urljoin(base_url, endpoint.lstrip('/'))
        
        # Don't include headers in the request if files are being uploaded
        # as requests will set the correct Content-Type with boundary
        headers = None if 'files' in kwargs else self.headers
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response
        except requests.exceptions.HTTPError as e:
            error_msg = f"MobSF API request failed with status {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f": {error_data.get('error', str(error_data))}"
            except:
                error_msg += f": {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"MobSF API request failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    def upload_file(self, file):
        """Upload APK file for analysis"""
        try:
            # Reset file pointer to start in case it was read before
            if hasattr(file, 'seek'):
                file.seek(0)
            
            # MobSF expects the file in a 'file' field with the correct content type
            files = {'file': (file.name, file, 'application/octet-stream')}
            
            # Make the upload request
            response = self._make_request(
                'POST',
                'upload',
                files=files
            )
            
            result = response.json()
            if 'error' in result:
                error_msg = result.get('description', 'Unknown error from MobSF')
                logger.error(f"MobSF upload error: {error_msg}")
                raise Exception(error_msg)
                
            # Expected response: {"file_name": "app.apk", "hash": "md5_hash", "scan_type": "apk"}
            if not all(k in result for k in ['file_name', 'hash', 'scan_type']):
                raise Exception("Unexpected response format from MobSF")
                
            return result
            
        except Exception as e:
            logger.error(f"File upload failed: {str(e)}")
            raise Exception(f"File upload failed: {str(e)}")

    def scan_file(self, file_hash, scan_type="apk"):
        """Start scanning the uploaded file
        
        Args:
            file_hash (str): The hash returned from the upload endpoint
            scan_type (str): Type of scan (apk, ipa, etc.)
            
        Returns:
            dict: Scan results or error information
        """
        try:
            # MobSF v1 API expects hash and scan_type as form data
            data = {
                'hash': file_hash,
                'scan_type': scan_type,
                're_scan': '0'  # 0 for new scan, 1 for rescan
            }
            
            response = self._make_request(
                'POST',
                'scan',
                data=data
            )
            
            result = response.json()
            if 'error' in result:
                error_msg = result.get('description', 'Unknown error during scan')
                logger.error(f"MobSF scan error: {error_msg}")
                raise Exception(error_msg)
                
            return result
            
        except Exception as e:
            error_msg = f"Scan failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    def get_scan_results(self, file_hash):
        """Get scan results in JSON format
        
        Args:
            file_hash (str): The hash of the scanned file
            
        Returns:
            dict: Scan results in JSON format
        """
        try:
            response = self._make_request(
                'POST',
                'report_json',
                data={'hash': file_hash}
            )
            return response.json()
        except Exception as e:
            error_msg = f"Failed to get scan results: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    def get_scan_logs(self, scan_id):
        """Get scan logs"""
        try:
            response = self._make_request(
                'GET',
                'scan_logs',
                params={"hash": scan_id}
            )
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get scan logs: {str(e)}")
            return {"error": str(e), "status": "error"}

    def download_pdf_report(self, file_hash):
        """Download PDF report
        
        Args:
            file_hash (str): The hash of the scanned file
            
        Returns:
            bytes: PDF file content or None if failed
        """
        try:
            response = self._make_request(
                'POST',
                'download_pdf',
                data={'hash': file_hash},
                stream=True
            )
            return response.content
        except Exception as e:
            error_msg = f"Failed to download PDF report: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

# Global instance
apk_analyzer = APKAnalyzer()
