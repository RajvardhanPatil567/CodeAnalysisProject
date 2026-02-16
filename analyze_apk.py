import os
import sys
import logging

# Add the backend directory to the Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Now import the APKAnalyzer
from apk_analyzer.services import APKAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def analyze_apk(apk_path):
    """Analyze an APK file using MobSF"""
    try:
        # Initialize the analyzer
        logger.info("Initializing APKAnalyzer...")
        analyzer = APKAnalyzer()
        
        # 1. Upload the APK
        logger.info(f"Uploading {os.path.basename(apk_path)}...")
        with open(apk_path, 'rb') as f:
            upload_result = analyzer.upload_file(f)
            
        if 'error' in upload_result:
            logger.error(f"Upload failed: {upload_result['error']}")
            return False
            
        file_hash = upload_result.get('hash')
        logger.info(f"Upload successful. File hash: {file_hash}")
        
        # 2. Start the scan
        logger.info("Starting scan...")
        scan_result = analyzer.scan_file(file_hash=file_hash, scan_type='apk')
        
        if 'error' in scan_result:
            logger.error(f"Scan failed: {scan_result['error']}")
            return False
            
        logger.info("Scan started successfully")
        
        # 3. Get scan results
        logger.info("Fetching scan results...")
        results = analyzer.get_scan_results(file_hash)
        
        print("\n=== SCAN RESULTS ===")
        print(f"App Name: {results.get('app_name', 'N/A')}")
        print(f"Package: {results.get('package_name', 'N/A')}")
        print(f"Version: {results.get('version_name', 'N/A')} (Code: {results.get('version_code', 'N/A')})")
        
        # 4. Get scan logs
        logs = analyzer.get_scan_logs(file_hash)
        if logs and 'logs' in logs:
            print("\n=== SCAN LOGS ===")
            for log in logs['logs'][-5:]:  # Show last 5 logs
                print(f"{log.get('time')} - {log.get('message')}")
        
        # 5. Download PDF report
        pdf_path = os.path.join(
            os.path.dirname(apk_path),
            f"{os.path.splitext(os.path.basename(apk_path))[0]}_report.pdf"
        )
        
        logger.info(f"Downloading PDF report to: {pdf_path}")
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
        
    print(f"Starting analysis of: {apk_path}\n")
    
    success = analyze_apk(apk_path)
    
    if success:
        print("\nAPK analysis completed successfully!")
    else:
        print("\nAPK analysis failed. Check the logs for details.")
    
    sys.exit(0 if success else 1)
