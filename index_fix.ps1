$path = 'app\page.tsx'
$lines = Get-Content $path

# Data Items
$lines[307] = '                thumbnail: "/assets/thumbnails/book.png",'
$lines[317] = '                thumbnail: "/assets/thumbnails/format.png",'
$lines[327] = '                thumbnail: "/assets/thumbnails/award.png",'

$lines[423] = '                  { value: "500+", label: "Completed", thumbnail: "/assets/thumbnails/award.png", color: "bg-green-500" },'
$lines[424] = '                  { value: "150+", label: "Courses", thumbnail: "/assets/thumbnails/book.png", color: "bg-blue-500" },'
$lines[425] = '                  { value: "5000+", label: "Students", thumbnail: "/assets/thumbnails/instruction.png", color: "bg-indigo-500" },'
$lines[426] = '                  { value: "99.5%", label: "Uptime", thumbnail: "/assets/thumbnails/rocket.png", color: "bg-cyan-500" },'

$lines[632] = '                thumbnail: "/assets/thumbnails/instruction.png",'
$lines[720] = '                thumbnail: "/assets/thumbnails/tip.png",'

# Category Icons that are still 'icon:'
$lines[640] = '                thumbnail: "/assets/thumbnails/format.png",'
$lines[648] = '                thumbnail: "/assets/thumbnails/instruction.png",'
$lines[656] = '                thumbnail: "/assets/thumbnails/rocket.png",'
$lines[664] = '                thumbnail: "/assets/thumbnails/instruction.png",'
$lines[672] = '                thumbnail: "/assets/thumbnails/award.png",'
$lines[680] = '                thumbnail: "/assets/thumbnails/robot.png",'
$lines[688] = '                thumbnail: "/assets/thumbnails/instruction.png",'
$lines[696] = '                thumbnail: "/assets/thumbnails/format.png",'
$lines[704] = '                thumbnail: "/assets/thumbnails/instruction.png",'
$lines[712] = '                thumbnail: "/assets/thumbnails/book.png",'

# Templates
$lines[370] = '                        <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>'
$lines[371] = '                          {item.thumbnail ? (<img src={item.thumbnail} className="w-10 h-10 object-contain" alt={item.title} />) : (<item.icon className={`w-7 h-7 ${item.iconColor}`} />)}'

$lines[429] = '                    <div className={`w-16 h-16 ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg overflow-hidden`}>'
$lines[430] = '                      {stat.thumbnail ? (<img src={stat.thumbnail} className="w-12 h-12 object-contain" alt={stat.label} />) : (<stat.icon className="w-8 h-8 text-white" />)}'

$lines[740] = '                  <div className={`absolute bottom-3 left-5 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md bg-white/90 dark:bg-slate-900/90 ${cat.color} shadow-lg shadow-black/10 overflow-hidden`}>'
$lines[741] = '                    {cat.thumbnail ? (<img src={cat.thumbnail} className="w-7 h-7 object-contain" alt={cat.label} />) : (<cat.icon className="w-5 h-5" />)}'

$lines | Set-Content $path
