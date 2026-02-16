import os
import sys
import logging
import requests
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MobSFClient:
    """Simple client for interacting with MobSF API v1."""
    
    def __init__(self, base_url, api_key, verify_ssl=False):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.verify_ssl = verify_ssl
        self.timeout = 30  # seconds
        
        self.session = requests.Session()
        self.session.verify = verify_ssl
        self.session.headers.update({
            'Authorization': self.api_key,
            'Content-Type': 'application/json'
        })
    
    def _make_request(self, method, endpoint, **kwargs):
        """Make an HTTP request to the MobSF API."""
        url = f"{self.base_url}/api/v1/{endpoint}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_msg = e.response.json().get('error', error_msg)
                except:
                    error_msg = e.response.text or error_msg
            return {'error': error_msg}
    
    def upload_file(self, file_path):
        """Upload a file to MobSF for analysis."""
        if not os.path.exists(file_path):
            return {'error': f'File not found: {file_path}'}
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'application/octet-stream')}
                
                # For file uploads, we need to omit the Content-Type header
                # to let requests set it with the boundary parameter
                headers = {k: v for k, v in self.session.headers.items() 
                         if k.lower() != 'content-type'}
                
                response = self.session.post(
                    f"{self.base_url}/api/v1/upload",
                    files=files,
                    headers=headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            error_msg = f'Upload failed: {str(e)}'
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_msg = e.response.json().get('error', error_msg)
                except:
                    error_msg = e.response.text or error_msg
            return {'error': error_msg}
    
    def scan_file(self, file_hash, scan_type='apk'):
        """Start a scan for the uploaded file."""
        data = {
            'scan_type': scan_type,
            'file_name': file_hash,
            're_scan': False
        }
        return self._make_request('POST', 'scan', json=data)
    
    def get_scan_results(self, file_hash):
        """Get the scan results for a file."""
        return self._make_request('GET', f'report_json/{file_hash}')
    
    def get_scan_logs(self, file_hash):
        """Get the scan logs for a file."""
        return self._make_request('GET', f'scan_logs/{file_hash}')
    
    def download_pdf_report(self, file_hash):
        """Download the PDF report for a scan."""
        try:
            response = self.session.get(
                f"{self.base_url}/api/v1/download_pdf/{file_hash}",
                timeout=self.timeout
            )
            response.raise_for_status()
            
            # If the response is JSON, it's an error
            if response.headers.get('content-type') == 'application/json':
                return response.json()
                
            return response.content
            
        except Exception as e:
            error_msg = f'Failed to download PDF: {str(e)}'
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_msg = e.response.json().get('error', error_msg)
                except:
                    error_msg = e.response.text or error_msg
            return {'error': error_msg}

def main():
    # Configuration
    MOBSF_URL = 'http://localhost:8000'  # Update if MobSF is running on a different URL
    MOBSF_API_KEY = '1d0f9f1d8d09c46e171a9eb9e48a15d53e021bdcd07ac7fe31f4184dff3477af'  # Your MobSF API key
    APK_PATH = r'C:\Users\nick9\Downloads\com-miui-calculator-315003003-70230966-ec423981671a2a7f8dc75626c6c33e21.apk'
    
    # Initialize the client
    client = MobSFClient(MOBSF_URL, MOBSF_API_KEY, verify_ssl=False)
    
    # 1. Test connection to MobSF
    logger.info(f"Testing connection to MobSF at {MOBSF_URL}...")
    try:
        response = requests.get(MOBSF_URL, timeout=5, verify=False)
        logger.info(f"✓ Connected to MobSF (Status: {response.status_code})")
    except Exception as e:
        logger.error(f"✗ Failed to connect to MobSF: {str(e)}")
        logger.info("Please make sure MobSF is running and accessible at the configured URL.")
        return 1
    
    # 2. Upload the APK
    logger.info(f"\n=== Uploading APK: {APK_PATH} ===")
    upload_result = client.upload_file(APK_PATH)
    
    if 'error' in upload_result:
        logger.error(f"✗ Upload failed: {upload_result['error']}")
        return 1
    
    file_hash = upload_result.get('hash')
    file_name = upload_result.get('file_name', 'unknown')
    logger.info(f"✓ APK uploaded successfully")
    print(f"File Name: {file_name}")
    print(f"File Hash: {file_hash}")
    
    # 3. Start the scan
    logger.info("\n=== Starting Scan ===")
    scan_result = client.scan_file(file_hash, scan_type='apk')
    
    if 'error' in scan_result:
        logger.error(f"✗ Scan failed: {scan_result['error']}")
        return 1
    
    scan_id = scan_result.get('scan_id')
    logger.info(f"✓ Scan started successfully")
    print(f"Scan ID: {scan_id}")
    
    # 4. Wait for scan to complete (simple polling)
    logger.info("\n=== Waiting for scan to complete ===")
    import time
    max_attempts = 30  # 30 attempts * 10 seconds = 5 minutes max
    
    for attempt in range(max_attempts):
        status = client.get_scan_results(file_hash)
        
        if 'error' in status:
            logger.error(f"✗ Error checking scan status: {status['error']}")
            return 1
        
        if status.get('status') == 'completed':
            logger.info("✓ Scan completed successfully")
            break
            
        logger.info(f"Scan in progress... (Attempt {attempt + 1}/{max_attempts})")
        time.sleep(10)  # Wait 10 seconds between checks
    else:
        logger.warning("⚠ Scan is taking longer than expected. You may need to check the MobSF interface.")
    
    # 5. Get scan results
    logger.info("\n=== Fetching Scan Results ===")
    results = client.get_scan_results(file_hash)
    
    if 'error' in results:
        logger.error(f"✗ Failed to get scan results: {results['error']}")
        return 1
    
    logger.info("✓ Retrieved scan results")
    
    # Display basic information
    print("\n=== APPLICATION DETAILS ===")
    print(f"App Name: {results.get('app_name', 'N/A')}")
    print(f"Package: {results.get('package_name', 'N/A')}")
    print(f"Version: {results.get('version_name', 'N/A')} (Code: {results.get('version_code', 'N/A')})")
    
    # Display SDK information if available
    if 'sdk' in results and results['sdk']:
        print("\n=== SDK INFORMATION ===")
        print(f"Target SDK: {results['sdk'].get('target_sdk', 'N/A')}")
        print(f"Min SDK: {results['sdk'].get('min_sdk', 'N/A')}")
        print(f"Max SDK: {results['sdk'].get('max_sdk', 'N/A')}")
    
    # Display permissions if available
    if 'permissions' in results and results['permissions']:
        print(f"\n=== PERMISSIONS ({len(results['permissions'])}) ===")
        for perm, status in list(results['permissions'].items())[:10]:  # Show first 10
            print(f"- {perm}: {status}")
        if len(results['permissions']) > 10:
            print(f"... and {len(results['permissions']) - 10} more permissions")
    
    # 6. Get scan logs
    logger.info("\n=== Fetching Scan Logs ===")
    logs = client.get_scan_logs(file_hash)
    
    if 'error' in logs:
        logger.warning(f"⚠ Could not fetch scan logs: {logs['error']}")
    else:
        logger.info(f"✓ Retrieved {len(logs.get('logs', []))} log entries")
        if 'logs' in logs and logs['logs']:
            print("\n=== LAST 5 LOG ENTRIES ===")
            for log in logs['logs'][-5:]:
                print(f"{log.get('time', 'N/A')} - {log.get('message', 'No message')}")
    
    # 7. Download PDF report
    logger.info("\n=== Downloading PDF Report ===")
    pdf_path = os.path.join(
        os.path.dirname(APK_PATH),
        f"{os.path.splitext(os.path.basename(APK_PATH))[0]}_report.pdf"
    )
    
    pdf_content = client.download_pdf_report(file_hash)
    
    if isinstance(pdf_content, dict) and 'error' in pdf_content:
        logger.warning(f"⚠ Could not download PDF report: {pdf_content['error']}")
    else:
        with open(pdf_path, 'wb') as f:
            f.write(pdf_content)
        logger.info(f"✓ PDF report saved to: {pdf_path}")
    
    logger.info("\n=== Analysis Complete ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())
