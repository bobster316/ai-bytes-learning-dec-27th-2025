
from PIL import Image

try:
    img_path = 'bg_image.png'
    img = Image.open(img_path)
    print(f"Dimensions: {img.size}")
    print(f"Format: {img.format}")
    print(f"Mode: {img.mode}")
    
    width, height = img.size
    aspect = width / height
    print(f"Aspect Ratio: {aspect:.2f}")
    
    if width > 1920 or height > 1080:
        print("⚠️ WARNING: Image is larger than 1080p.")
    
    if abs(aspect - (16/9)) > 0.1:
        print("⚠️ WARNING: Aspect ratio is not 16:9.")

except Exception as e:
    print(f"Error: {e}")
