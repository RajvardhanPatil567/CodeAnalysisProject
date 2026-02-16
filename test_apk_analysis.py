import os
import sys
import logging
from django.conf import settings

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'static_analysis_framework.settings')
import django
django.setup()

from apk_analyzer.services import APKAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def analyze_apk(apk_path):
    try:
        # Initialize the analyzer
        analyzer = APKAnalyzer()
        
        # Step 1: Upload the APK
        logger.info(f"Uploading APK: {apk_path}")
        with open(apk_path, 'rb') as f:
            upload_result = analyzer.upload_file(f)
            
        if 'error' in upload_result:
            logger.error(f"Upload failed: {upload_result['error']}")
            return False
            
        file_hash = upload_result['hash']
        logger.info(f"APK uploaded successfully. File hash: {file_hash}")
        
        # Step 2: Start the scan
        logger.info("Starting scan...")
        scan_result = analyzer.scan_file(file_hash=file_hash, scan_type='apk')
        
        if 'error' in scan_result:
            logger.error(f"Scan failed: {scan_result['error']}")
            return False
            
        logger.info("Scan completed successfully")
        
        # Step 3: Get scan results
        logger.info("Fetching scan results...")
        results = analyzer.get_scan_results(file_hash)
        print("\n=== SCAN RESULTS ===")
        print(f"App Name: {results.get('app_name', 'N/A')}")
        print(f"Package Name: {results.get('package_name', 'N/A')}")
        print(f"Version: {results.get('version_name', 'N/A')} (Code: {results.get('version_code', 'N/A')})")
        print(f"SDK: {results.get('sdk', {}).get('target_sdk', 'N/A')} (Min: {results.get('sdk', {}).get('min_sdk', 'N/A')})")
        
        # Step 4: Get scan logs
        logs = analyzer.get_scan_logs(file_hash)
        if 'logs' in logs:
            print("\n=== SCAN LOGS ===")
            for log in logs['logs']:
                print(f"{log['time']} - {log['message']}")
        
        # Step 5: Download PDF report
        pdf_path = os.path.join(os.path.dirname(apk_path), f"{os.path.splitext(os.path.basename(apk_path))[0]}_report.pdf")
        pdf_content = analyzer.download_pdf_report(file_hash)
        if not isinstance(pdf_content, dict):  # If not an error dict
            with open(pdf_path, 'wb') as f:
                f.write(pdf_content)
            logger.info(f"PDF report saved to: {pdf_path}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error during APK analysis: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    apk_path = r"C:\Users\nick9\Downloads\com-miui-calculator-315003003-70230966-ec423981671a2a7f8dc75626c6c33e21.apk"
    if not os.path.exists(apk_path):
        print(f"Error: APK file not found at {apk_path}")
        sys.exit(1)
        
    success = analyze_apk(apk_path)
    if success:
        print("\nAPK analysis completed successfully!")
    else:
        print("\nAPK analysis failed. Check the logs for details.")
        sys.exit(1)
