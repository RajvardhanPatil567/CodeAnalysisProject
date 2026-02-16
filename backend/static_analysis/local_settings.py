# Local development settings
import os
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# MobSF Configuration
MOBSF_URL = 'http://localhost:8000'
MOBSF_API_KEY = ''
MOBSF_VERIFY_SSL = False  # Disable SSL verification for local development

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'db.sqlite3',
    }
}

# Debug settings
DEBUG = True

# CORS settings
CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Security settings for development
SECRET_KEY = 'django-insecure-dev-key-change-in-production'
