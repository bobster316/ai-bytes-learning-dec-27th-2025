import requests
import os

# Custom .env loader
def load_env():
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    # Split only on first =
                    parts = line.split('=', 1)
                    key = parts[0].strip()
                    value = parts[1].strip()
                    # Handle quotes
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    os.environ[key] = value
    except Exception as e:
        print(f"Error loading .env: {e}")

load_env()
api_key = os.environ.get('HEYGEN_API_KEY')
print(f"API Key loaded: {'Yes' if api_key else 'No'}")

# Test variants
file_path = "public/ai_avatar/sarah.png"
# Final test: Auto-detect mime type
print(f"\n--- Testing Auto-Detect MIME ---")
try:
    with open(file_path, 'rb') as f:
        # Let requests guess the MIME type
        files = {'file': f}
        headers = {'X-Api-Key': api_key}
        
        response = requests.post("https://upload.heygen.com/v1/asset", headers=headers, files=files)
        
        print(f"Status: {response.status_code}")
        print(f"Body: {response.text}")

except Exception as e:
    print(f"Error: {e}")
