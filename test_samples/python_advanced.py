# Advanced Python test file with security, performance, and maintainability issues

import os
import pickle
import subprocess
import sqlite3
from typing import Any, Dict, List

class DatabaseManager:
    """Class with multiple security and performance issues"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection = None
    
    # Security vulnerability - SQL injection
    def get_user_by_name(self, name: str) -> Dict[str, Any]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Dangerous: SQL injection vulnerability
        query = f"SELECT * FROM users WHERE name = '{name}'"
        cursor.execute(query)
        
        result = cursor.fetchone()
        conn.close()
        return result
    
    # Performance issue - connection not reused
    def bulk_insert_users(self, users: List[Dict[str, str]]) -> None:
        for user in users:
            # Inefficient: creating new connection for each insert
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (name, email) VALUES (?, ?)", 
                         (user['name'], user['email']))
            conn.commit()
            conn.close()

# Security vulnerability - pickle deserialization
def load_user_data(filename: str) -> Any:
    """Dangerous function that deserializes untrusted data"""
    with open(filename, 'rb') as f:
        # Security risk: pickle can execute arbitrary code
        return pickle.load(f)

# Security vulnerability - command injection
def process_file(filename: str) -> str:
    """Function vulnerable to command injection"""
    # Dangerous: user input directly in shell command
    command = f"cat {filename} | wc -l"
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

# Performance issue - inefficient algorithm
def find_duplicates_slow(items: List[str]) -> List[str]:
    """O(n²) algorithm when O(n) is possible"""
    duplicates = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j] and items[i] not in duplicates:
                duplicates.append(items[i])
    return duplicates

# Code quality issue - function doing too much
def process_user_registration(user_data: Dict[str, Any]) -> bool:
    """Function with too many responsibilities"""
    
    # Validation logic
    if not user_data.get('email') or '@' not in user_data['email']:
        return False
    
    if not user_data.get('password') or len(user_data['password']) < 8:
        return False
    
    # Password hashing logic
    import hashlib
    hashed_password = hashlib.sha256(user_data['password'].encode()).hexdigest()
    
    # Database logic
    db = DatabaseManager('users.db')
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)",
                      (user_data['email'], hashed_password))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        return False
    
    # Email sending logic
    import smtplib
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('admin@example.com', 'hardcoded_password')  # Security issue
        message = f"Welcome {user_data['email']}!"
        server.sendmail('admin@example.com', user_data['email'], message)
        server.quit()
    except Exception as e:
        print(f"Email error: {e}")
    
    # Logging logic
    with open('user_registrations.log', 'a') as f:
        f.write(f"User registered: {user_data['email']}\n")
    
    return True

# High cyclomatic complexity
def complex_business_logic(user: Dict[str, Any], order: Dict[str, Any]) -> str:
    """Function with high cyclomatic complexity"""
    if user:
        if user.get('is_premium'):
            if order.get('total', 0) > 100:
                if user.get('country') == 'US':
                    if order.get('items'):
                        if len(order['items']) > 5:
                            if user.get('loyalty_points', 0) > 1000:
                                if order.get('payment_method') == 'credit_card':
                                    if user.get('credit_score', 0) > 700:
                                        return 'PREMIUM_DISCOUNT_APPLIED'
                                    else:
                                        return 'STANDARD_DISCOUNT'
                                else:
                                    return 'CASH_DISCOUNT'
                            else:
                                return 'BASIC_DISCOUNT'
                        else:
                            return 'SMALL_ORDER_DISCOUNT'
                    else:
                        return 'NO_ITEMS'
                else:
                    return 'INTERNATIONAL_PRICING'
            else:
                return 'MINIMUM_ORDER_NOT_MET'
        else:
            return 'STANDARD_PRICING'
    else:
        return 'INVALID_USER'

# Performance issue - global variable access in loop
global_cache = {}

def inefficient_cache_access(keys: List[str]) -> List[Any]:
    """Inefficient global variable access"""
    results = []
    for key in keys:
        # Accessing global variable in tight loop
        if key in global_cache:
            results.append(global_cache[key])
        else:
            # Expensive operation
            value = expensive_computation(key)
            global_cache[key] = value
            results.append(value)
    return results

def expensive_computation(key: str) -> str:
    """Simulates expensive computation"""
    import time
    time.sleep(0.001)  # Simulate delay
    return f"computed_{key}"

# Security issue - hardcoded secrets
class APIClient:
    """Class with hardcoded credentials"""
    
    def __init__(self):
        # Security vulnerability: hardcoded API key
        self.api_key = "sk-1234567890abcdef"
        self.secret_key = "secret_abc123"
        self.database_password = "admin123"
    
    def make_request(self, endpoint: str) -> Dict[str, Any]:
        """Make API request with hardcoded credentials"""
        import requests
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'X-Secret': self.secret_key
        }
        # In real code, this would make an actual request
        return {'status': 'success', 'endpoint': endpoint}

# Code quality issue - unused imports and variables
import json  # Unused import
import datetime  # Unused import
from collections import defaultdict  # Unused import

def process_data_with_unused_vars(data: List[Dict[str, Any]]) -> List[str]:
    """Function with unused variables"""
    unused_counter = 0
    unused_list = []
    unused_dict = {}
    
    results = []
    for item in data:
        if item.get('active'):
            results.append(item['name'])
    
    return results

# Performance issue - memory leak potential
class CacheManager:
    """Class with potential memory leak"""
    
    def __init__(self):
        self._cache = {}
        self._access_count = {}
    
    def store(self, key: str, value: Any) -> None:
        """Store value without any eviction policy"""
        self._cache[key] = value
        self._access_count[key] = self._access_count.get(key, 0) + 1
        # No cache size limit or eviction - potential memory leak
    
    def get(self, key: str) -> Any:
        """Get value from cache"""
        self._access_count[key] = self._access_count.get(key, 0) + 1
        return self._cache.get(key)

# Security vulnerability - path traversal
def read_user_file(filename: str) -> str:
    """Function vulnerable to path traversal"""
    # Dangerous: no path validation
    file_path = f"/var/uploads/{filename}"
    
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "File not found"
    except Exception as e:
        return f"Error: {e}"

# Performance issue - inefficient string operations
def build_html_report(data: List[Dict[str, str]]) -> str:
    """Inefficient string building"""
    html = "<html><body><table>"
    
    for row in data:
        # Inefficient string concatenation in loop
        html += "<tr>"
        for key, value in row.items():
            html += f"<td>{key}: {value}</td>"
        html += "</tr>"
    
    html += "</table></body></html>"
    return html

if __name__ == "__main__":
    # Test the vulnerable functions
    print("Testing static analysis framework...")
    
    # This would trigger various warnings in the analyzer
    test_data = [
        {"name": "Alice", "email": "alice@example.com", "active": True},
        {"name": "Bob", "email": "bob@example.com", "active": False}
    ]
    
    result = process_data_with_unused_vars(test_data)
    print(f"Processed {len(result)} items")
