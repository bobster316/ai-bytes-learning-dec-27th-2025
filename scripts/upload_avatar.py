
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

api_key = os.getenv('HEYGEN_API_KEY')
file_path = 'merged_avatar_final.jpg'
url = 'https://upload.heygen.com/v1/asset'

if not os.path.exists(file_path):
    print(f"Error: {file_path} not found")
    exit(1)

print(f"Uploading {file_path}...")

files = {
    'file': ('avatar.png', open(file_path, 'rb'), 'image/png')
}
headers = {
    'X-Api-Key': api_key
}

try:
    response = requests.post(url, headers=headers, files=files)
    print(f"Status Code: {response.status_code}")
    print("Response:", response.text)
except Exception as e:
    print(f"Error: {e}")
