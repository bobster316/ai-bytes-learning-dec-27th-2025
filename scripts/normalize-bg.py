
from PIL import Image

def resize_image():
    try:
        img_path = 'bg_image.png'
        img = Image.open(img_path)
        
        # Resize to standard 1280x720 (720p)
        # We use LANCZOS for high quality upscaling
        new_img = img.resize((1280, 720), Image.Resampling.LANCZOS)
        
        # Save as a fresh new PNG to strip any bad metadata
        new_img.save('bg_image_normalized.png')
        print("✅ Created bg_image_normalized.png (1280x720)")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    resize_image()
