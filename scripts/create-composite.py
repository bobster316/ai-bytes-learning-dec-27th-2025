
from PIL import Image

def composite():
    try:
        # Load Background (Base) - Verified 1280x720
        bg = Image.open('bg_final.jpg').convert('RGBA')
        bg_w, bg_h = bg.size
        print(f"Background: {bg.size}")

        # Load Avatar (Overlay) - Verified Transparent
        avatar = Image.open('clean_avatar.png').convert('RGBA')
        av_w, av_h = avatar.size
        print(f"Avatar Original: {avatar.size}")

        # Calculate Scale to fit height of background
        # We want the avatar to be prominent.
        # Let's scale avatar so its height is ~90% of background height?
        # Or if it's a headshot, maybe just place it?
        # Assuming verify standard portrait.
        # Let's scale height to equal background height (cover vertical)
        scale_ratio = bg_h / av_h
        new_w = int(av_w * scale_ratio)
        new_h = int(av_h * scale_ratio)
        
        print(f"Resizing Avatar to: {new_w}x{new_h}")
        avatar_resized = avatar.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Position: Center Bottom
        x_offset = (bg_w - new_w) // 2
        y_offset = bg_h - new_h # Align bottom
        
        print(f"Pasting at: ({x_offset}, {y_offset})")
        
        # Composite
        final = Image.new('RGBA', bg.size)
        final.paste(bg, (0,0))
        final.paste(avatar_resized, (x_offset, y_offset), avatar_resized)
        
        # Save as JPEG (Opaque)
        final.convert('RGB').save('merged_avatar_final.jpg', quality=95)
        print("✅ Success: Created merged_avatar_final.jpg")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    composite()
