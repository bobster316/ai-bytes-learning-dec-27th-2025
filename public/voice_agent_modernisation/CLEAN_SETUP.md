# 🎯 Clean Minimal Voice Widget - Simple Setup

## What You're Getting

A **clean, professional voice widget** that:
- ✅ Small: 56×56px button → 300×400px chat
- ✅ Matches your site's design
- ✅ Actually works with voice
- ✅ Connects to your existing API
- ✅ No flashy effects

---

## 🚀 Setup (5 Minutes)

### Step 1: Copy the Component

Copy `voice-widget-clean-minimal.tsx` to:
```
K:\recover\from_23rd\components\voice\voice-widget.tsx
```

### Step 2: Add to Your Layout

Edit `K:\recover\from_23rd\app\layout.tsx`:

```typescript
import CleanVoiceWidget from '@/components/voice/voice-widget';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CleanVoiceWidget />
      </body>
    </html>
  );
}
```

### Step 3: Verify Dependencies

Make sure you have:
```bash
npm install framer-motion lucide-react
```

### Step 4: Test

```bash
npm run dev
# Visit localhost:3000
# Click the cyan mic button in bottom-right
# Allow microphone access
# Start talking!
```

---

## ✅ Why Voice Works Now

The component is already configured to call your existing endpoints:

```typescript
// Sends voice message to AI
POST /api/voice/message
Body: { message: "user's speech text" }

// Gets audio response
POST /api/voice/speak  
Body: { text: "AI response" }
```

**It will automatically:**
1. ✅ Use Web Speech API for voice recognition
2. ✅ Send transcribed text to your Gemini API
3. ✅ Get AI response
4. ✅ Convert to speech via ElevenLabs/OpenAI
5. ✅ Play audio response

---

## 🔧 Add User Context (Optional)

If you need to pass user/course context, update line ~109:

```typescript
body: JSON.stringify({
  message: text,
  userId: 'get-from-your-auth',     // Add this
  courseId: 'current-course-id',    // Add this
}),
```

---

## 🎨 Customize Colors

Match your exact brand colors (currently using cyan #06b6d4):

```typescript
// Find and replace in the component:
from-cyan-500 to-cyan-600  → from-[#086c7f] to-[#0891b2]
bg-cyan-500                → bg-[#086c7f]
text-cyan-600              → text-[#086c7f]
```

---

## 📏 Adjust Size

### Make Button Smaller
```typescript
// Line ~145
className="... w-14 h-14 ..."  // Change to w-12 h-12
```

### Make Chat Smaller
```typescript
// Line ~160
className="... w-[300px] h-[400px] ..."  // Change to w-[280px] h-[360px]
```

---

## 🐛 Troubleshooting

### "Microphone not working"
- Check HTTPS (required for mic access)
- Check browser permissions
- Try Chrome/Edge (best support)

### "No AI response"
- Check `/api/voice/message` endpoint exists
- Check environment variables (GEMINI_API_KEY, etc.)
- Check console for errors

### "No audio playback"
- Check `/api/voice/speak` endpoint
- Check ELEVENLABS_API_KEY is set
- Unmute the widget (speaker icon)

---

## 📱 Mobile Responsive

Already responsive! On mobile:
- Button: Same size (56×56px)
- Chat: Adapts to screen width
- Touch-friendly controls

---

## ✨ Features

- 🎤 Voice recognition (Web Speech API)
- 🗣️ Text-to-speech (your existing TTS)
- 💬 Clean chat interface
- 🔇 Mute/unmute toggle
- ⌨️ Keyboard friendly
- 📱 Mobile optimized
- 🌙 Dark mode support
- ♿ Accessible

---

## 🎯 That's It!

Simple, clean, professional. No over-the-top effects.

**Total time: 5 minutes**

Your voice widget is ready to work! 🚀
