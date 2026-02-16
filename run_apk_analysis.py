import os
import sys
import logging
import requests

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Now import the APKAnalyzer
from apk_analyzer.services import APKAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    apk_path = r"C:\Users\nick9\Downloads\com-miui-calculator-315003003-70230966-ec423981671a2a7f8dc75626c6c33e21.apk"
    
    if not os.path.exists(apk_path):
        print(f"Error: APK file not found at {apk_path}")
        return 1
    
    print(f"Starting analysis of: {apk_path}")
    print("=" * 60 + "\n")
    
    try:
        # Initialize the analyzer
        logger.info("Initializing APKAnalyzer...")
        analyzer = APKAnalyzer()
        
        # Test connection to MobSF
        logger.info(f"Testing connection to MobSF at {analyzer.BASE_URL}...")
        try:
            response = requests.get(analyzer.BASE_URL, timeout=5, verify=analyzer.verify_ssl)
            logger.info(f"✓ Connected to MobSF (Status: {response.status_code})")
        except Exception as e:
            logger.error(f"✗ Failed to connect to MobSF: {str(e)}")
            logger.info("Please make sure MobSF is running and accessible at the configured URL.")
            return 1
        
        # Step 1: Upload the APK
        logger.info("\n=== Step 1: Uploading APK ===")
        try:
            with open(apk_path, 'rb') as f:
                logger.info(f"Uploading {os.path.basename(apk_path)}...")
                upload_result = analyzer.upload_file(f)
                
            if 'error' in upload_result:
                logger.error(f"✗ Upload failed: {upload_result['error']}")
                return 1
                
            file_hash = upload_result['hash']
            logger.info("✓ APK uploaded successfully")
            print(f"File Name: {upload_result.get('file_name')}")
            print(f"File Hash: {file_hash}")
            print(f"Scan Type: {upload_result.get('scan_type')}")
            
        except Exception as e:
            logger.error(f"✗ Error during file upload: {str(e)}", exc_info=True)
            return 1
            
        # Step 2: Start the scan
        logger.info("\n=== Step 2: Starting Scan ===")
        try:
            logger.info("Starting scan...")
            scan_result = analyzer.scan_file(file_hash=file_hash, scan_type='apk')
            
            if 'error' in scan_result:
                logger.error(f"✗ Scan failed: {scan_result['error']}")
                return 1
                
            logger.info("✓ Scan started successfully")
            print(f"Scan ID: {scan_result.get('scan_id')}")
            
            # Wait for scan to complete (simple polling)
            logger.info("Waiting for scan to complete (this may take a few minutes)...")
            import time
            max_attempts = 30  # 30 attempts * 10 seconds = 5 minutes max
            for attempt in range(max_attempts):
                status = analyzer.get_scan_results(file_hash)
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
            
        except Exception as e:
            logger.error(f"✗ Error during scan: {str(e)}", exc_info=True)
            return 1
            
        # Step 3: Get scan results
        logger.info("\n=== Step 3: Fetching Scan Results ===")
        try:
            logger.info("Retrieving scan results...")
            results = analyzer.get_scan_results(file_hash)
            
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
            
            # Display security findings if available
            if 'security' in results and results['security']:
                print("\n=== SECURITY FINDINGS ===")
                for category, findings in results['security'].items():
                    if findings:
                        print(f"\n{category.upper()}:")
                        for finding in findings[:5]:  # Show first 5 findings per category
                            print(f"- {finding}")
                        if len(findings) > 5:
                            print(f"... and {len(findings) - 5} more")
            
        except Exception as e:
            logger.error(f"✗ Error fetching scan results: {str(e)}", exc_info=True)
            return 1
            
        # Step 4: Get scan logs
        logger.info("\n=== Step 4: Fetching Scan Logs ===")
        try:
            logger.info("Retrieving scan logs...")
            logs = analyzer.get_scan_logs(file_hash)
            
            if 'error' in logs:
                logger.warning(f"⚠ Could not fetch scan logs: {logs['error']}")
            else:
                logger.info(f"✓ Retrieved {len(logs.get('logs', []))} log entries")
                if 'logs' in logs and logs['logs']:
                    print("\n=== LAST 5 LOG ENTRIES ===")
                    for log in logs['logs'][-5:]:
                        print(f"{log.get('time', 'N/A')} - {log.get('message', 'No message')}")
        
        except Exception as e:
            logger.warning(f"⚠ Could not fetch scan logs: {str(e)}")
        
        # Step 5: Download PDF report
        logger.info("\n=== Step 5: Downloading PDF Report ===")
        try:
            pdf_path = os.path.join(
                os.path.dirname(apk_path), 
                f"{os.path.splitext(os.path.basename(apk_path))[0]}_report.pdf"
            )
            
            logger.info(f"Downloading PDF report to: {pdf_path}")
            pdf_content = analyzer.download_pdf_report(file_hash)
            
            if isinstance(pdf_content, dict) and 'error' in pdf_content:
                logger.warning(f"⚠ Could not download PDF report: {pdf_content['error']}")
            else:
                with open(pdf_path, 'wb') as f:
                    f.write(pdf_content)
                logger.info(f"✓ PDF report saved to: {pdf_path}")
                
        except Exception as e:
            logger.error(f"✗ Error downloading PDF report: {str(e)}", exc_info=True)
            return 1
            
        logger.info("\n" + "=" * 60)
        logger.info("✓ APK analysis completed successfully!")
        return 0
        
    except Exception as e:
        logger.error(f"✗ Unexpected error: {str(e)}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())
