
from PIL import Image
import sys

try:
    img_path = 'clean_avatar.png'
    img = Image.open(img_path)
    
    print(f"Format: {img.format}")
    print(f"Mode: {img.mode}")
    
    if img.mode == 'RGBA':
        extrema = img.getextrema()
        alpha_extrema = extrema[3]
        print(f"Alpha Range: {alpha_extrema}")
        
        if alpha_extrema[0] == 255 and alpha_extrema[1] == 255:
             print("RESULT: Image is RGBA but Alpha is fully OPAQUE (255). It is NOT transparent.")
        else:
             print("RESULT: Image has transparency.")
             
             # Check (0,0) pixel to see if it's opaque (fake checkerboard)
             tl_pixel = img.getpixel((0, 0))
             print(f"Top-Left Pixel (0,0) RGBA: {tl_pixel}")
             
             if tl_pixel[3] == 255:
                 print("⚠️ WARNING: The top-left pixel is fully OPAQUE (255).")
                 print("   This strongly suggests the 'checkerboard' background is BAKED IN as pixels.")
             else:
                 print("✅ Top-left pixel is transparent.")
                 
             # Scan diagonal to find opaque background
             print("\nScanning Diagonal Samples:")
             print("\nScanning Center Samples:")
             width, height = img.size
             cx, cy = width // 2, height // 2
             for i in range(-50, 60, 20): # Scan a cross pattern in center
                 px = img.getpixel((cx + i, cy))
                 print(f"Sample Center ({cx + i}, {cy}): {px}")
                 
             print("Check for Grey/White opaque pixels above.")
                 
             print("Check the samples above. If you see (255, 255, 255, 255) [White] or (204, 204, 204, 255) [Grey] or similar repeating, it's a fake checkerboard background.")
    elif img.mode == 'RGB':
        print("RESULT: Image is RGB (No Alpha Channel). It cannot be transparent.")
    else:
        print(f"RESULT: Image mode is {img.mode}")

except Exception as e:
    print(f"Error: {e}")
