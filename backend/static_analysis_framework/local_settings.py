"""
Local settings for the Static Analysis Framework.
This file is for local development and should not be committed to version control.
"""

# MobSF Configuration
MOBSF_URL = 'http://localhost:8000'  # Update this if your MobSF instance is running on a different host/port
MOBSF_API_KEY = '1d0f9f1d8d09c46e171a9eb9e48a15d53e021bdcd07ac7fe31f4184dff3477af'  # Get this from your MobSF instance
MOBSF_VERIFY_SSL = False  # Set to True if using HTTPS with valid certificates

# If you're using Docker, you might use something like:
# MOBSF_URL = 'http://mobsf:8000'  # 'mobsf' is the service name in docker-compose
