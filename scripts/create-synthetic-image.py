
from PIL import Image, ImageDraw

def create_test_image():
    # Create a 512x512 transparent image
    img = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a red circle
    draw.ellipse((100, 100, 412, 412), fill=(255, 0, 0, 255))
    
    # Save
    img.save('synthetic_transparent.png')
    print("Created synthetic_transparent.png")

if __name__ == "__main__":
    create_test_image()
