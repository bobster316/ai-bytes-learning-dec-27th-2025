// API Integration Instructions for Quantum Voice Widget V2
//
// The widget is now installed at: components/voice/voice-widget.tsx
//
// TO CONNECT TO YOUR EXISTING API:
//
// 1. The handleSendMessage function (line 269-306) needs to be updated
// 2. Replace lines 284-305 with the code shown below
// 3. The endpoint /api/voice/message already exists and uses Gemini
//
// REPLACE THIS SECTION (lines 284-305):
/*
    // TODO: Replace with your actual API call
    setTimeout(() => {
      clearInterval(activityInterval);
      const aiMessage: Message = {
        role: 'assistant',
        content: 'This is where your AI response will appear...',
        timestamp: new Date()
      };
      ...
    }, 2000);
*/

// WITH THIS CODE:
/*
    try {
      const response = await fetch('/api/voice/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      clearInterval(activityInterval);

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response || data.text || 'Sorry, I encountered an error.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setVoiceState('speaking');
      
      if (data.audio && !isMuted) {
        const audio = new Audio(data.audio);
        const audioInterval = setInterval(() => setAudioLevel(Math.random()), 100);

        audio.onended = () => {
          clearInterval(audioInterval);
          setVoiceState('idle');
          setAudioLevel(0);
        };
        audio.play().catch(() => {
          clearInterval(audioInterval);
          setVoiceState('idle');
        });
      } else {
        setTimeout(() => setVoiceState('idle'), 2000);
      }
    } catch (error) {
      clearInterval(activityInterval);
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try again?',
        timestamp: new Date()
      }]);
      setVoiceState('idle');
    }
*/
