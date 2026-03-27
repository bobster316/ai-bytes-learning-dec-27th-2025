
from PIL import Image

def convert():
    try:
        img = Image.open('bg_image_normalized.png')
        if img.mode == 'RGBA':
            # Convert to RGB (drops alpha, assumes white/black background if transparent, but we know it's opaque content)
            # Actually, to be safe, paste on black if it had transparency, but user said it's a server room.
            # Just converting to RGB is usually fine for opaque images.
            rgb_img = img.convert('RGB')
            rgb_img.save('bg_final.jpg', 'JPEG', quality=95)
            print("✅ Converted to bg_final.jpg (RGB)")
        else:
            img.save('bg_final.jpg', 'JPEG', quality=95)
            print("✅ Saved as bg_final.jpg")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    convert()
