
# How to Choose Your ElevenLabs Voice

## 1. Get Your API Key
1.  Log in to [ElevenLabs.io](https://elevenlabs.io).
2.  Click on your profile icon in the top right -> **Profile**.
3.  Click the "Eye" icon next to **API Key** to reveal it.
4.  Copy the key.
5.  Open `.env.local` in your project root.
6.  Add or update: `ELEVENLABS_API_KEY=your_key_here`

## 2. Choose a Voice
You can browse voices on the ElevenLabs website to find one you like.
Common "UK English Young Woman" options:
*   **Alice**: `Xb7hH8MSUJpSbSDYk0k2` (This is the default I set up)
*   **Charlotte**: (You can find her ID by searching the Voice Library)
*   **Lily**: (Another popular choice)

## 3. Configure the Voice ID
1.  Once you find a voice you like on the website, look for its **Voice ID**.
    *   *Tip:* You can also run `node list-elevenlabs-voices.js` in your terminal (after setting the API key) to see a list of IDs for voices you've added to your VoiceLab.
2.  Open `.env.local` again.
3.  Add: `ELEVENLABS_VOICE_ID=the_voice_id_you_copied`
4.  Restart the dev server (`Ctrl+C` then `npm run dev`) to apply changes.
