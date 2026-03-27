
from PIL import Image

try:
    img = Image.open('bg_image_normalized.png')
    print(f"Format: {img.format}")
    print(f"Mode: {img.mode}")
    print(f"Size: {img.size}")
except Exception as e:
    print(f"Error: {e}")
