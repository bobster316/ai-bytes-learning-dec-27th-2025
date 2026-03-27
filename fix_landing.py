import os

path = r'app\page.tsx'

if not os.path.exists(path):
    print(f"Error: {path} not found")
    exit(1)

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Precise corruption fixes
# Matching the exact characters seen in repr
text = text.replace('thumbnail: " /assets/thumbnails/book.png\\\\,', 'thumbnail: "/assets/thumbnails/book.png",')
text = text.replace('thumbnail: \\\\/assets/thumbnails/format.png\\\\,', 'thumbnail: "/assets/thumbnails/format.png",')
text = text.replace('thumbnail: \\\\/assets/thumbnails/award.png\\\\,', 'thumbnail: "/assets/thumbnails/award.png",')
text = text.replace('thumbnail: \\\\/assets/thumbnails/instruction.png\\\\,', 'thumbnail: "/assets/thumbnails/instruction.png",')
text = text.replace('thumbnail: \\\\/assets/thumbnails/rocket.png\\\\,', 'thumbnail: "/assets/thumbnails/rocket.png",')
text = text.replace('thumbnail: \\\\/assets/thumbnails/tip.png\\\\,', 'thumbnail: "/assets/thumbnails/tip.png",')

# 2. Complete remaining icon replacements in data arrays
replacements = [
    ('icon: Library,', 'thumbnail: "/assets/thumbnails/book.png",'),
    ('icon: Clock,', 'thumbnail: "/assets/thumbnails/format.png",'),
    ('icon: Award,', 'thumbnail: "/assets/thumbnails/award.png",'),
    ('icon: CheckCircle2,', 'thumbnail: "/assets/thumbnails/award.png",'),
    ('icon: BookOpen,', 'thumbnail: "/assets/thumbnails/book.png",'),
    ('icon: Users,', 'thumbnail: "/assets/thumbnails/instruction.png",'),
    ('icon: TrendingUp,', 'thumbnail: "/assets/thumbnails/rocket.png",'),
    ('icon: Brain,', 'thumbnail: "/assets/thumbnails/instruction.png",'),
    ('icon: Lightbulb,', 'thumbnail: "/assets/thumbnails/tip.png",'),
    ('icon: Wand2,', 'thumbnail: "/assets/thumbnails/format.png",'),
    ('icon: MessageSquare,', 'thumbnail: "/assets/thumbnails/instruction.png",'),
    ('icon: Code,', 'thumbnail: "/assets/thumbnails/rocket.png",'),
    ('icon: Briefcase,', 'thumbnail: "/assets/thumbnails/instruction.png",'),
    ('icon: Shield,', 'thumbnail: "/assets/thumbnails/award.png",'),
    ('icon: Bot,', 'thumbnail: "/assets/thumbnails/robot.png",'),
    ('icon: MessageCircle,', 'thumbnail: "/assets/thumbnails/instruction.png",'),
    ('icon: Eye,', 'thumbnail: "/assets/thumbnails/format.png",'),
    ('icon: Building2,', 'thumbnail: "/assets/thumbnails/instruction.png",'),
    ('icon: Database,', 'thumbnail: "/assets/thumbnails/book.png",')
]

for old, new in replacements:
    text = text.replace(old, new)

# 3. Update Templates - Containers
text = text.replace('duration-300`}>', 'duration-300 overflow-hidden`}>')
text = text.replace('shadow-lg`}>', 'shadow-lg overflow-hidden`}>')
text = text.replace('shadow-black/10`}>', 'shadow-black/10 overflow-hidden`}>')

# 4. Update Templates - Icons
text = text.replace('<item.icon className={`w-7 h-7 ${item.iconColor}`} />', 
                    '{item.thumbnail ? (<img src={item.thumbnail} className="w-10 h-10 object-contain" alt={item.title} />) : (<item.icon className={`w-7 h-7 ${item.iconColor}`} />)}')

text = text.replace('<stat.icon className="w-8 h-8 text-white" />', 
                    '{stat.thumbnail ? (<img src={stat.thumbnail} className="w-12 h-12 object-contain" alt={stat.label} />) : (<stat.icon className="w-8 h-8 text-white" />)}')

text = text.replace('<cat.icon className="w-5 h-5" />', 
                    '{cat.thumbnail ? (<img src={cat.thumbnail} className="w-7 h-7 object-contain" alt={cat.label} />) : (<cat.icon className="w-5 h-5" />)}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Finished definitive repair.")
