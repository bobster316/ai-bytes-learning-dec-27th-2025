# 🚀 Quick Start: Get a FREE AI API Key

The course generator needs an AI API to work. Here are your **FREE** options:

---

## ⭐ **RECOMMENDED: OpenRouter (Easiest)**

**Why**: Truly free, no credit card, instant access

**Steps**:
1. Visit: https://openrouter.ai
2. Sign up (just email + password)
3. Go to: **Keys** section
4. Click: **Create Key**
5. Copy the key

**Add to `.env.local`**:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

**Free Models Available**:
- Meta Llama 3.1 70B (FREE forever)
- No daily limits for free tier
- No credit card required

---

## Option 2: Groq (Fast but Limited)

**Free Tier**: 14,400 requests/day (plenty for testing!)

**Steps**:
1. Visit: https://console.groq.com
2. Sign up
3. Get API key
4. Add to `.env.local`:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```

**Note**: If you saw a paywall, try refreshing or verifying your account

---

## Option 3: Together AI ($25 Free Credits)

**Steps**:
1. Visit: https://together.ai
2. Sign up
3. Get $25 free credits
4. Add to `.env.local`:
   ```bash
   TOGETHER_API_KEY=your_together_key_here
   ```

---

## Option 4: OpenAI ($5 Free Credits)

**For new accounts only**:
1. Visit: https://platform.openai.com
2. Sign up
3. Get $5 free credits (expires in 3 months)
4. Add to `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```

---

## 🎯 After Getting Your Key

1. **Update `.env.local`** with your chosen key
2. **Restart dev server**: `npm run dev`
3. **Visit**: http://localhost:3000/admin/courses/generate
4. **Generate your first course!**

The system will automatically detect which key you have and use the right provider!

---

## 💡 Which Should You Choose?

| Provider | Best For | Free Tier | Card Required |
|----------|----------|-----------|---------------|
| **OpenRouter** ⭐ | Quick start | Unlimited | ❌ No |
| **Groq** | Speed | 14,400/day | ❌ No |
| **Together AI** | Credits | $25 | ✅ Yes |
| **OpenAI** | Quality | $5 | ✅ Yes |

**Recommendation**: Start with **OpenRouter** - it's the easiest!

---

## ⚠️ Troubleshooting

**"No API key found" error?**
- Make sure you added the key to `.env.local` (not `.env.example`)
- Restart your dev server after adding the key
- Check there are no typos in the variable name

**OpenRouter key not working?**
- Make sure key starts with `sk-or-v1-`
- Verify account is activated
- Try creating a new key

**Still stuck?**
Let me know which provider you chose and I'll help debug!
