import os

path = r'app\page.tsx'

if not os.path.exists(path):
    print(f"ERROR: {path} not found")
    exit(1)

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

print(f"File loaded, length: {len(text)}")

# Use extremely generic strings to catch the corruption
replacements = [
    ('thumbnail: " /assets/thumbnails/book.png\\', 'thumbnail: "/assets/thumbnails/book.png"'),
    ('thumbnail: \\/assets/thumbnails/format.png\\', 'thumbnail: "/assets/thumbnails/format.png"'),
    ('thumbnail: \\/assets/thumbnails/award.png\\', 'thumbnail: "/assets/thumbnails/award.png"'),
    ('thumbnail: \\/assets/thumbnails/instruction.png\\', 'thumbnail: "/assets/thumbnails/instruction.png"'),
    ('thumbnail: \\/assets/thumbnails/rocket.png\\', 'thumbnail: "/assets/thumbnails/rocket.png"'),
    ('thumbnail: \\/assets/thumbnails/tip.png\\', 'thumbnail: "/assets/thumbnails/tip.png"')
]

for old, new in replacements:
    count = text.count(old)
    if count > 0:
        text = text.replace(old, new)
        print(f"Replaced {count} instances of {old}")
    else:
        print(f"NOT FOUND: {old}")

# Template fixes
templates = [
    ('duration-300`}>', 'duration-300 overflow-hidden`}>'),
    ('shadow-lg`}>', 'shadow-lg overflow-hidden`}>'),
    ('shadow-black/10`}>', 'shadow-black/10 overflow-hidden`}>')
]

for old, new in templates:
    if old in text:
        text = text.replace(old, new)
        print(f"Template fixed: {old}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Finished.")
