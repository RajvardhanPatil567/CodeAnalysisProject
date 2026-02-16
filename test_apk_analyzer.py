import os
import sys
import logging
import requests
from apk_analyzer.services import APKAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_apk_analysis(apk_path):
    try:
        # Initialize the analyzer
        logger.info("Initializing APKAnalyzer...")
        analyzer = APKAnalyzer()
        
        # Test connection to MobSF
        logger.info("Testing connection to MobSF...")
        try:
            response = requests.get(analyzer.BASE_URL, timeout=5)
            logger.info(f"Connected to MobSF at {analyzer.BASE_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to MobSF at {analyzer.BASE_URL}: {str(e)}")
            return False
        
        # Step 1: Upload the APK
        logger.info(f"\n=== Uploading APK: {apk_path} ===")
        try:
            with open(apk_path, 'rb') as f:
                upload_result = analyzer.upload_file(f)
                
            if 'error' in upload_result:
                logger.error(f"Upload failed: {upload_result['error']}")
                return False
                
            file_hash = upload_result['hash']
            logger.info(f"✓ APK uploaded successfully")
            print(f"File Name: {upload_result.get('file_name')}")
            print(f"File Hash: {file_hash}")
            print(f"Scan Type: {upload_result.get('scan_type')}")
            
        except Exception as e:
            logger.error(f"Error during file upload: {str(e)}")
            return False
            
        # Step 2: Start the scan
        logger.info("\n=== Starting Scan ===")
        try:
            scan_result = analyzer.scan_file(file_hash=file_hash, scan_type='apk')
            
            if 'error' in scan_result:
                logger.error(f"Scan failed: {scan_result['error']}")
                return False
                
            logger.info("✓ Scan started successfully")
            print(f"Scan ID: {scan_result.get('scan_id')}")
            
        except Exception as e:
            logger.error(f"Error during scan: {str(e)}")
            return False
            
        # Step 3: Get scan results
        logger.info("\n=== Fetching Scan Results ===")
        try:
            results = analyzer.get_scan_results(file_hash)
            logger.info("✓ Retrieved scan results")
            
            print("\n=== APPLICATION DETAILS ===")
            print(f"App Name: {results.get('app_name', 'N/A')}")
            print(f"Package: {results.get('package_name', 'N/A')}")
            print(f"Version: {results.get('version_name', 'N/A')} (Code: {results.get('version_code', 'N/A')})")
            
            if 'sdk' in results:
                print("\n=== SDK INFORMATION ===")
                print(f"Target SDK: {results['sdk'].get('target_sdk', 'N/A')}")
                print(f"Min SDK: {results['sdk'].get('min_sdk', 'N/A')}")
                print(f"Max SDK: {results['sdk'].get('max_sdk', 'N/A')}")
            
            if 'permissions' in results and results['permissions']:
                print("\n=== PERMISSIONS ===")
                for perm, status in results['permissions'].items():
                    print(f"- {perm}: {status}")
                    
        except Exception as e:
            logger.error(f"Error fetching scan results: {str(e)}")
            return False
            
        # Step 4: Get scan logs
        logger.info("\n=== Fetching Scan Logs ===")
        try:
            logs = analyzer.get_scan_logs(file_hash)
            if 'logs' in logs and logs['logs']:
                logger.info(f"Retrieved {len(logs['logs'])} log entries")
                print("\n=== LAST 5 LOG ENTRIES ===")
                for log in logs['logs'][-5:]:
                    print(f"{log['time']} - {log['message']}")
        except Exception as e:
            logger.warning(f"Could not fetch scan logs: {str(e)}")
        
        # Step 5: Download PDF report
        logger.info("\n=== Downloading PDF Report ===")
        try:
            pdf_path = os.path.join(os.path.dirname(apk_path), f"{os.path.splitext(os.path.basename(apk_path))[0]}_report.pdf")
            pdf_content = analyzer.download_pdf_report(file_hash)
            
            if not isinstance(pdf_content, dict):  # If not an error dict
                with open(pdf_path, 'wb') as f:
                    f.write(pdf_content)
                logger.info(f"✓ PDF report saved to: {pdf_path}")
            else:
                logger.warning("Could not download PDF report")
                
        except Exception as e:
            logger.error(f"Error downloading PDF report: {str(e)}")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    apk_path = r"C:\Users\nick9\Downloads\com-miui-calculator-315003003-70230966-ec423981671a2a7f8dc75626c6c33e21.apk"
    
    if not os.path.exists(apk_path):
        print(f"Error: APK file not found at {apk_path}")
        sys.exit(1)
        
    print(f"Starting analysis of: {apk_path}")
    print("=" * 60)
    
    success = test_apk_analysis(apk_path)
    
    print("\n" + "=" * 60)
    if success:
        print("✓ APK analysis completed successfully!")
    else:
        print("✗ APK analysis failed. Check the logs above for details.")
    
    sys.exit(0 if success else 1)
