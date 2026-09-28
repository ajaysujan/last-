import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Volume2, 
  X, 
  Sparkles, 
  Send, 
  Zap, 
  Play,
  Globe,
  AlertCircle,
  Square
} from 'lucide-react';
import { femaleSpeech } from '../utils/speech';

interface AIAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSendQueryToMainChat: (query: string, reply: string) => void;
  isDark: boolean;
  language?: string;
}

export const AIAssistantOverlay: React.FC<AIAssistantOverlayProps> = ({
  isOpen,
  onClose,
  onSendQueryToMainChat,
  isDark,
  language = 'en',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const INDIAN_VOICE_LANGUAGES: Record<string, string> = {
    'Hindi': 'hi-IN', 'English (India)': 'en-IN', 'Bengali': 'bn-IN', 'Assamese': 'as-IN',
    'Bodo': 'brx-IN', 'Dogri': 'doi-IN', 'Gujarati': 'gu-IN', 'Kannada': 'kn-IN',
    'Kashmiri': 'ks-IN', 'Konkani': 'kok-IN', 'Maithili': 'mai-IN', 'Malayalam': 'ml-IN',
    'Manipuri': 'mni-IN', 'Marathi': 'mr-IN', 'Nepali': 'ne-IN', 'Odia': 'or-IN',
    'Punjabi': 'pa-IN', 'Sanskrit': 'sa-IN', 'Santali': 'sat-IN', 'Sindhi': 'sd-IN',
    'Tamil': 'ta-IN', 'Telugu': 'te-IN', 'Urdu': 'ur-IN', 'Bhojpuri': 'bho-IN',
    'Awadhi': 'awa-IN', 'Chhattisgarhi': 'hne-IN', 'Magahi': 'mag-IN', 'Mizo': 'lus-IN', 'Rajasthani': 'raj-IN',
  };
  const speechCodeForLanguage = (lang: string): string => ({
    en: 'en-IN', hi: 'hi-IN', hinglish: 'hi-IN', as: 'as-IN', bn: 'bn-IN', brx: 'hi-IN', doi: 'hi-IN',
    gu: 'gu-IN', kn: 'kn-IN', ks: 'ks-IN', kok: 'kok-IN', mai: 'mai-IN', ml: 'ml-IN', mni: 'mni-IN', mr: 'mr-IN',
    ne: 'ne-IN', or: 'or-IN', pa: 'pa-IN', sa: 'sa-IN', sat: 'sat-IN', sd: 'sd-IN', ta: 'ta-IN', te: 'te-IN', ur: 'ur-IN',
    bho: 'hi-IN', awa: 'hi-IN', hne: 'hi-IN', mag: 'hi-IN', lus: 'lus-IN', raj: 'hi-IN',
  } as Record<string,string>)[lang] || 'en-IN';
  const [speechLanguage, setSpeechLanguage] = useState<string>(() => {
    try { return localStorage.getItem('aura_voice_language') || speechCodeForLanguage(language); } catch { return speechCodeForLanguage(language); }
  });
  const [activeLanguageForChat, setActiveLanguageForChat] = useState<string>(() => speechCodeForLanguage(language));
  const [voiceStyle, setVoiceStyle] = useState<'female' | 'male' | 'neutral'>(() => {
    try { return (localStorage.getItem('aura_voice_style') as any) || 'female'; } catch { return 'female'; }
  });
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(() => {
    try { return femaleSpeech.getSettings().autoSpeak; } catch { return false; }
  });
  const [voiceTagline] = useState(() => {
    const lines = [
      "Ask anything. I'll explain it clearly.",
      'Your voice. Your language. Your AURA.',
      'Tap, speak, learn — one step at a time.',
      'I can listen, think, and speak back.',
      "Let's turn your questions into understanding.",
      'AURA is ready to talk through it with you.'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  });
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'aura'; text: string }>>([
    {
      role: 'aura',
      text: 'Hello! I am AURA. You can speak to me and ask any question.'
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<any>(null);
  const isProcessingRef = useRef(false); // prevents duplicate /api/chat calls from voice events
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  useEffect(() => {
    const next = speechCodeForLanguage(language);
    setSpeechLanguage(next);
    setActiveLanguageForChat(next);
    femaleSpeech.saveSettings({ language: next });
  }, [language]);

  useEffect(() => {
    const syncVoicePrefs = () => {
      const settings = femaleSpeech.getSettings();
      setAutoSpeakEnabled(settings.autoSpeak);
      setVoiceStyle(settings.voiceStyle);
      setSpeechLanguage(settings.language || speechCodeForLanguage(language));
      setActiveLanguageForChat(settings.language || speechCodeForLanguage(language));
    };
    window.addEventListener('aura:prefs-changed', syncVoicePrefs);
    syncVoicePrefs();
    return () => window.removeEventListener('aura:prefs-changed', syncVoicePrefs);
  }, [language]);

  const selectSpeechLanguage = (code: string) => {
    setSpeechLanguage(code);
    setActiveLanguageForChat(code);
    try { localStorage.setItem('aura_voice_language', code); } catch {}
    femaleSpeech.saveSettings({ language: code });
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 150);
    }
  };

  const selectVoiceStyle = (style: 'female' | 'male' | 'neutral') => {
    setVoiceStyle(style);
    try { localStorage.setItem('aura_voice_style', style); } catch {}
    femaleSpeech.saveSettings({ voiceStyle: style });
  };


  useEffect(() => {
    const unsub = femaleSpeech.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, transcript, isThinking]);

  const handleClose = () => {
    stopListening();
    femaleSpeech.stop();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    onClose();
  };

  const handleProcessUserSpeech = async (spokenText: string) => {
    const query = spokenText.trim();
    if (!query || isProcessingRef.current) return;

    const lower = query.toLowerCase();

    const languageAliases: Array<{ code: string; aliases: string[] }> = [
      { code: 'hi-IN', aliases: ['hindi', 'हिंदी', 'हिन्दी'] },
      { code: 'mr-IN', aliases: ['marathi', 'मराठी'] },
      { code: 'bn-IN', aliases: ['bengali', 'bangla', 'বাংলা'] },
      { code: 'gu-IN', aliases: ['gujarati', 'ગુજરાતી'] },
      { code: 'ta-IN', aliases: ['tamil', 'தமிழ்'] },
      { code: 'te-IN', aliases: ['telugu', 'తెలుగు'] },
      { code: 'kn-IN', aliases: ['kannada', 'ಕನ್ನಡ'] },
      { code: 'ml-IN', aliases: ['malayalam', 'മലയാളം'] },
      { code: 'pa-IN', aliases: ['punjabi', 'ਪੰਜਾਬੀ'] },
      { code: 'ur-IN', aliases: ['urdu', 'اردو'] },
      { code: 'or-IN', aliases: ['odia', 'oriya', 'ଓଡ଼ିଆ'] },
      { code: 'as-IN', aliases: ['assamese', 'অসমীয়া'] },
      { code: 'en-IN', aliases: ['english', 'अंग्रेजी', 'इंग्लिश'] },
    ];
    const wantsLanguageChange = /\b(talk|speak|chat|language|baat|bolo|bolna|बात|बोलो|बोलना|भाषा)\b|में|me\b/.test(lower);
    if (wantsLanguageChange) {
      const requested = languageAliases.find((entry) => entry.aliases.some((alias) => lower.includes(alias.toLowerCase())));
      if (requested) {
        selectSpeechLanguage(requested.code);
        const languageName = Object.entries(INDIAN_VOICE_LANGUAGES).find(([, code]) => code === requested.code)?.[0] || 'the selected language';
        const confirmation = `Theek hai. Ab hum ${languageName} mein baat karenge.`;
        setConversationHistory((prev) => [...prev, { role: 'user', text: query }, { role: 'aura', text: confirmation }]);
        femaleSpeech.speak(confirmation, undefined, { language: requested.code, voiceStyle });
        return;
      }
    }

    const femaleRequest = /\b(female|girl|lady|woman|ladki|mahila|aurat)\b/.test(lower) && /\b(voice|awaaz|speak|bolo|bolna)\b/.test(lower);
    const maleRequest = /\b(male|boy|man|ladka|purush|aadmi)\b/.test(lower) && /\b(voice|awaaz|speak|bolo|bolna)\b/.test(lower);
    if (femaleRequest || maleRequest) {
      const nextStyle = femaleRequest ? 'female' : 'male';
      selectVoiceStyle(nextStyle);
      const confirmation = nextStyle === 'female'
        ? 'Theek hai. Ab main female-style voice me baat karungi.'
        : 'Theek hai. Ab main male-style voice me baat karunga.';
      setConversationHistory((prev) => [...prev, { role: 'user', text: query }, { role: 'aura', text: confirmation }]);
      femaleSpeech.speak(confirmation, undefined, { language: speechLanguage, voiceStyle: nextStyle });
      return;
    }

    isProcessingRef.current = true;

    stopListening();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    femaleSpeech.playAudioTone();

    setConversationHistory((prev) => [...prev, { role: 'user', text: query }]);
    setTranscript('');
    setTypedInput('');
    setIsThinking(true);
    setSpeechError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          history: conversationHistory.slice(-4),
          language: activeLanguageForChat,
          stream: false,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) {
        throw new Error(data?.error || 'Failed to generate response');
      }
      const reply = data.answer;
      setConversationHistory((prev) => [...prev, { role: 'aura', text: reply }]);
      onSendQueryToMainChat(query, reply);

      if (autoSpeakEnabled) {
        femaleSpeech.speak(reply, undefined, { language: speechLanguage, voiceStyle });
      }
    } catch (err: any) {
      console.error('AI Assistant Error:', err);
      const errMsg = 'AI service is temporarily unavailable. Please try again.';
      setConversationHistory((prev) => [...prev, { role: 'aura', text: errMsg }]);
      if (autoSpeakEnabled) {
        femaleSpeech.speak(errMsg, undefined, { language: speechLanguage, voiceStyle });
      }
    } finally {
      isProcessingRef.current = false;
      setIsThinking(false);
    }
  };

  const startListening = () => {
    setSpeechError(null);
    femaleSpeech.stop();
    femaleSpeech.playAudioTone();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice recognition is not supported in your browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        const cleaned = currentTranscript.trim();
        setTranscript(cleaned);

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          if (cleaned.length > 2) {
            handleProcessUserSpeech(cleaned);
          }
        }, 1300);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission is required.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const pending = transcriptRef.current.trim();
        if (pending.length > 2 && !isThinking) {
          handleProcessUserSpeech(pending);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Recognition start exception:', err);
      setSpeechError('Failed to start the microphone.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleTestVoice = () => {
    const phrase = speechLanguage.startsWith('hi')
      ? 'Namaste! Main AURA hoon. Aap jo bhi poochna chahein, main use aasaan tarike se samjhaungi.'
      : 'Hello! I am AURA. Ask me anything and I will explain it clearly, step by step.';
    femaleSpeech.testVoice(phrase, { language: speechLanguage, voiceStyle });
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[700px] h-[86vh] max-h-[780px] rounded-[36px] p-[2px] animated-shimmer-border shadow-[0_25px_90px_rgba(37,99,235,0.45)] flex flex-col overflow-hidden"
      >
        <div className={`w-full h-full rounded-[34px] flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-[#0b1322] text-white' : 'bg-white text-[#0f172a]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full animate-fluid-aurora flex items-center justify-center text-white shadow-md shadow-pink-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-1.5 leading-tight">
                  <span>AURA Assistant</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300">
                    Live Realistic Voice
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ask with live voice and hear the answer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Language */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <select
                  value={speechLanguage}
                  onChange={(e) => selectSpeechLanguage(e.target.value)}
                  className="max-w-[150px] bg-transparent text-[11px] font-semibold outline-none cursor-pointer dark:text-white"
                  aria-label="Voice language"
                >
                  {Object.entries(INDIAN_VOICE_LANGUAGES).map(([name, code]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Voice style */}
              <div className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                {(['female', 'male', 'neutral'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => selectVoiceStyle(style)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize cursor-pointer transition-all ${voiceStyle === style ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-blue-600'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              {/* Test / Stop Audio Buttons */}
              {isSpeaking ? (
                <button
                  onClick={() => femaleSpeech.stop()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs font-bold transition-all cursor-pointer"
                  title="Stop Voice"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Stop Voice</span>
                </button>
              ) : (
                <button
                  onClick={handleTestVoice}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer"
                  title="Test Realistic Voice Output"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Test Voice</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="Close Assistant (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Interactive Speech Orb & Controls */}
          <div className="py-4 px-6 flex flex-col items-center justify-center shrink-0 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-blue-50/50 via-purple-50/20 to-transparent dark:from-blue-950/25 dark:via-purple-950/10">
            <div className="relative flex items-center justify-center my-1.5">
              <div className={`absolute w-36 h-36 rounded-full blur-xl transition-all duration-500 opacity-60 ${
                isListening 
                  ? 'bg-gradient-to-r from-red-500 via-pink-500 to-indigo-500 scale-125 animate-pulse'
                  : isSpeaking
                  ? 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 scale-120 animate-fluid-aurora'
                  : isThinking
                  ? 'bg-gradient-to-r from-amber-400 to-violet-500 animate-spin scale-110'
                  : 'bg-gradient-to-r from-blue-400 to-purple-400 scale-100'
              }`} />

              <button
                onClick={() => {
                  if (isSpeaking) { femaleSpeech.stop(); return; }
                  if (isListening) { stopListening(); return; }
                  if (!isThinking) startListening();
                }}
                className={`relative w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center text-white cursor-pointer shadow-2xl transition-all duration-300 active:scale-95 z-10 overflow-hidden ${
                  isListening
                    ? 'bg-gradient-to-tr from-red-500 to-rose-600 ring-4 ring-red-400/50 scale-105'
                    : isThinking
                    ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 ring-4 ring-amber-400/40'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-blue-500 via-indigo-600 to-cyan-500 ring-4 ring-blue-400/50 scale-105'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 ring-4 ring-white/40 dark:ring-slate-700/60 hover:scale-105'
                }`}
                title={isSpeaking ? 'Stop speaking' : isListening ? 'Stop listening' : 'Tap AURA to speak'}
                aria-label={isSpeaking ? 'Stop AURA voice' : isListening ? 'Stop listening' : 'Tap AURA to speak'}
              >
                <div className="absolute inset-[10px] rounded-full border border-white/30" />
                <div className="absolute inset-[17px] rounded-full border border-white/25 rotate-45" />
                <div className="absolute inset-[25px] rounded-full border-2 border-white/50 -rotate-12" />
                <div className="relative z-10 w-4 h-4 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)]" />
                {isListening && <Mic className="absolute z-20 w-5 h-5 text-white animate-pulse" />}
                {isThinking && <Zap className="absolute z-20 w-5 h-5 text-white animate-spin" />}
                {isSpeaking && <Volume2 className="absolute z-20 w-5 h-5 text-white animate-pulse" />}
                <span className="relative z-20 text-[9px] font-extrabold tracking-widest mt-7">
                  {isListening ? 'LISTENING' : isThinking ? 'THINKING' : isSpeaking ? 'SPEAKING' : 'AURA'}
                </span>
              </button>
            </div>

            {/* Status and Equalizer Wave */}
            <div className="mt-1 text-[11px] text-slate-400 italic text-center max-w-md">{voiceTagline}</div>

            <div className="flex items-center gap-2 mt-2">
              {isSpeaking && (
                <div className="flex items-center gap-1 h-4">
                  <span className="w-1 bg-pink-500 rounded-full animate-sound-wave-1" />
                  <span className="w-1 bg-pink-500 rounded-full animate-sound-wave-2" />
                  <span className="w-1 bg-pink-500 rounded-full animate-sound-wave-3" />
                  <span className="w-1 bg-pink-500 rounded-full animate-sound-wave-4" />
                </div>
              )}
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isListening 
                  ? 'Listening... please speak'
                  : isThinking 
                  ? 'Preparing the answer...'
                  : isSpeaking 
                  ? 'Speaking...'
                  : 'Tap the mic and ask a question'}
              </div>
            </div>

            {speechError && (
              <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{speechError}</span>
              </div>
            )}

            {transcript && (
              <div className="mt-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-[#16233d] border border-blue-200 dark:border-blue-900 shadow-sm max-w-lg w-full text-center animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                  You asked:
                </span>
                <span className="text-sm font-semibold italic text-slate-800 dark:text-slate-100">
                  "{transcript}"
                </span>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleProcessUserSpeech(transcript)}
                    className="px-3.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm active:scale-95 cursor-pointer"
                  >
                    Send Now
                  </button>
                  <button
                    onClick={() => setTranscript('')}
                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conversation History Stream */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5">
            {conversationHistory.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-bold text-slate-400">
                  {item.role === 'user' ? 'You' : 'AURA'}
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[88%] text-[13.5px] leading-relaxed shadow-xs whitespace-pre-wrap ${
                    item.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : isDark
                      ? 'bg-[#15233d] border border-[#233555] text-slate-100 rounded-tl-sm'
                      : 'bg-slate-100 text-[#152238] rounded-tl-sm'
                  }`}
                >
                  {item.text}
                </div>
                {item.role === 'aura' && (
                  <button
                    onClick={() => femaleSpeech.speak(item.text, undefined, { language: speechLanguage, voiceStyle })}
                    className="mt-1 px-2 py-0.5 text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Listen Again</span>
                  </button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Voice Questions Chips */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e172a] shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Questions:
              </span>
              <button
                onClick={() => { const next = !autoSpeakEnabled; setAutoSpeakEnabled(next); try { localStorage.setItem('aura_voice_auto_speak', String(next)); } catch {} }}
                className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Auto Voice:</span>
                <span className={`font-bold ${autoSpeakEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {autoSpeakEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Explain Coulomb's law",
                "Help me master a difficult topic with a clear step-by-step explanation.",
                "What is the double-helix structure of DNA?",
                "What is Raoult's law?"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleProcessUserSpeech(suggestion)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    isDark
                      ? 'border-[#223555] bg-[#16233d] text-blue-300 hover:border-blue-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-xs'
                  }`}
                >
                  ⚡ {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Integrated Typed Input Bar */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0b1322] shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (typedInput.trim()) {
                  handleProcessUserSpeech(typedInput);
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Type here or tap the mic to speak..."
                className={`flex-1 px-4 py-2 rounded-2xl border text-xs outline-none transition-colors ${
                  isDark 
                    ? 'bg-[#141e33] border-[#223555] text-white placeholder:text-slate-500 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-300' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600'
                }`}
                title="Speak"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!typedInput.trim() || isThinking}
                className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
