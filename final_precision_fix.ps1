$path = 'app\page.tsx'
$content = [System.IO.File]::ReadAllText($path)

# Repair specific corruptions seen in latest view_file
$content = $content.Replace('thumbnail: \/assets/thumbnails/book.png\,', 'thumbnail: "/assets/thumbnails/book.png",')
$content = $content.Replace('thumbnail: \/assets/thumbnails/format.png\,', 'thumbnail: "/assets/thumbnails/format.png",')
$content = $content.Replace('thumbnail: \/assets/thumbnails/award.png\,', 'thumbnail: "/assets/thumbnails/award.png",')
$content = $content.Replace('thumbnail: \/assets/thumbnails/instruction.png\,', 'thumbnail: "/assets/thumbnails/instruction.png",')
$content = $content.Replace('thumbnail: \/assets/thumbnails/rocket.png\,', 'thumbnail: "/assets/thumbnails/rocket.png",')
$content = $content.Replace('thumbnail: \/assets/thumbnails/tip.png\,', 'thumbnail: "/assets/thumbnails/tip.png",')

# Templates (Verify if any missed)
$content = $content.Replace('group-hover:scale-110 transition-transform duration-300`}>', 'group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>')
$content = $content.Replace('group-hover:rotate-3 transition-all duration-300 shadow-lg`}>', 'group-hover:rotate-3 transition-all duration-300 shadow-lg overflow-hidden`}>')
$content = $content.Replace('shadow-lg shadow-black/10`}>', 'shadow-lg shadow-black/10 overflow-hidden`}>')

# Category items that might still be 'icon:'
$content = $content.Replace('icon: Wand2,', 'thumbnail: "/assets/thumbnails/format.png",')
$content = $content.Replace('icon: MessageSquare,', 'thumbnail: "/assets/thumbnails/instruction.png",')
$content = $content.Replace('icon: Code,', 'thumbnail: "/assets/thumbnails/rocket.png",')
$content = $content.Replace('icon: Briefcase,', 'thumbnail: "/assets/thumbnails/instruction.png",')
$content = $content.Replace('icon: Shield,', 'thumbnail: "/assets/thumbnails/award.png",')
$content = $content.Replace('icon: Bot,', 'thumbnail: "/assets/thumbnails/robot.png",')
$content = $content.Replace('icon: MessageCircle,', 'thumbnail: "/assets/thumbnails/instruction.png",')
$content = $content.Replace('icon: Eye,', 'thumbnail: "/assets/thumbnails/format.png",')
$content = $content.Replace('icon: Building2,', 'thumbnail: "/assets/thumbnails/instruction.png",')
$content = $content.Replace('icon: Database,', 'thumbnail: "/assets/thumbnails/book.png",')

[System.IO.File]::WriteAllText($path, $content)
