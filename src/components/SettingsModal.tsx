import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Globe, 
  Volume2, 
  User, 
  Trash2, 
  Check, 
  Play, 
  Sparkles, 
  Shield, 
  GraduationCap, 
  ClipboardList, 
  ImageIcon, 
  Calendar,
  Layers
} from 'lucide-react';
import { femaleSpeech, VoiceSettings } from '../utils/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  username: string;
  onUpdateUsername: (name: string) => void;
  onClearChatHistory: () => void;
  currentLanguage: string;
  onChangeLanguage: (lang: string) => void;
  onOpenQuiz?: () => void;
  onOpenImageCreator?: () => void;
  onOpenQuickPrompt?: (prompt: string) => void;
  onSetWideLayout?: (enabled: boolean) => void;
  onResetSettings?: () => void;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'hinglish', name: 'Hinglish', native: 'Hinglish' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ks', name: 'Kashmiri', native: 'कॉशुर' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी' },
  { code: 'awa', name: 'Awadhi', native: 'अवधी' },
  { code: 'hne', name: 'Chhattisgarhi', native: 'छत्तीसगढ़ी' },
  { code: 'mag', name: 'Magahi', native: 'मगही' },
  { code: 'lus', name: 'Mizo', native: 'Mizo' },
  { code: 'raj', name: 'Rajasthani', native: 'राजस्थानी' },
]

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  username,
  onUpdateUsername,
  onClearChatHistory,
  currentLanguage,
  onChangeLanguage,
  onOpenQuiz,
  onOpenImageCreator,
  onOpenQuickPrompt,
  onSetWideLayout,
  onResetSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'speech' | 'tools' | 'profile' | 'data' | 'personalize' | 'learning' | 'appearance' | 'notifications' | 'privacy' | 'about'>('general');
  const [prefs, setPrefs] = useState<Record<string, any>>(() => {
    try { return JSON.parse(localStorage.getItem('aura_prefs') || '{}'); } catch { return {}; }
  });
  const setPref = (key: string, value: any) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('aura_prefs', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('aura:prefs-changed'));
      } catch {}
      return next;
    });
  };
  useEffect(() => {
    const size = prefs.fontSize === 'large' ? '18px' : prefs.fontSize === 'small' ? '14px' : '16px';
    document.documentElement.style.fontSize = size;
    document.documentElement.classList.toggle('reduce-motion', Boolean(prefs.reduceMotion));
  }, [prefs.fontSize, prefs.reduceMotion]);
  const Toggle = ({ k, label, hint, def = false }: { k: string; label: string; hint?: string; def?: boolean }) => {
    const on = prefs[k] ?? def;
    return (
      <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="text-xs font-bold">{label}</div>
          {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => setPref(k, !on)}
          className={`relative w-10 h-6 rounded-full shrink-0 transition-colors cursor-pointer ${on ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
        </button>
      </div>
    );
  };
  const Choice = ({ k, label, options, def }: { k: string; label: string; options: Array<[string, string]>; def: string }) => (
    <div className="py-3 border-b border-slate-100 dark:border-slate-800">
      <div className="text-xs font-bold mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, text]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPref(k, value)}
            className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold border cursor-pointer transition-colors ${
              (prefs[k] ?? def) === value
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
  const PanelHead = ({ title, sub }: { title: string; sub: string }) => (
    <div className="mb-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
  const newTabs: Array<[typeof activeTab, string, React.ReactNode]> = [
    ['personalize', 'Personalization', <Sparkles className="w-4 h-4" />],
    ['learning', 'Learning & Goals', <GraduationCap className="w-4 h-4" />],
    ['appearance', 'Appearance & Access', <Layers className="w-4 h-4" />],
    ['notifications', 'Notifications', <Calendar className="w-4 h-4" />],
    ['privacy', 'Privacy & Security', <Shield className="w-4 h-4" />],
    ['about', 'About AURA', <Settings className="w-4 h-4" />],
  ];

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(femaleSpeech.getSettings());
  const [tempName, setTempName] = useState(username);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setVoiceSettings(femaleSpeech.getSettings());
      setTempName(username);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, username]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const speechCodeForLanguage = (lang: string) => {
    const map: Record<string, string> = {
      en: 'en-IN', hi: 'hi-IN', hinglish: 'hi-IN', as: 'as-IN', bn: 'bn-IN', brx: 'hi-IN', doi: 'hi-IN',
      gu: 'gu-IN', kn: 'kn-IN', ks: 'ks-IN', kok: 'kok-IN', mai: 'mai-IN', ml: 'ml-IN', mni: 'mni-IN', mr: 'mr-IN',
      ne: 'ne-IN', or: 'or-IN', pa: 'pa-IN', sa: 'sa-IN', sat: 'sat-IN', sd: 'sd-IN', ta: 'ta-IN', te: 'te-IN', ur: 'ur-IN',
      bho: 'hi-IN', awa: 'hi-IN', hne: 'hi-IN', mag: 'hi-IN', lus: 'lus-IN', raj: 'hi-IN',
    };
    return map[lang] || lang || 'en-IN';
  };

  const handleVoiceSettingChange = (field: keyof VoiceSettings, value: any) => {
    const updated = { ...voiceSettings, [field]: value };
    setVoiceSettings(updated);
    femaleSpeech.saveSettings({ [field]: value });
  };

  const handleTestVoiceAudio = () => {
    setIsTestingVoice(true);
    const testPhrase = currentLanguage === 'hi' 
      ? 'Namaste! Main AURA hoon, aapki padhai ki saathi. Meri awaaz ekdum swabhavik hai!'
      : 'Hello! I am AURA, your personal AI assistant. My voice is ready.';
    femaleSpeech.testVoice(testPhrase);
    setTimeout(() => setIsTestingVoice(false), 3000);
  };

  const handleSaveProfile = () => {
    if (tempName.trim()) {
      onUpdateUsername(tempName.trim());
      showToast('Profile updated successfully');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[780px] h-[84vh] max-h-[700px] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-[#0f192d] border-[#253858] text-white' : 'bg-white border-[#e2e8f0] text-[#0f172a]'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Settings</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Personalize your AURA learning experience, realistic voice & tools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-xs font-bold transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 right-6 z-20 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg animate-in slide-in-from-top-2 duration-200 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body with Left Tabs and Right Panels */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Navigation Tabs */}
          <div className={`w-[205px] shrink-0 border-r p-3 space-y-1 overflow-y-auto ${
            isDark ? 'border-[#1e2e4a] bg-[#0c1424]' : 'border-slate-100 bg-slate-50/70'
          }`}>
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>General & Lang</span>
            </button>
            <button
              onClick={() => setActiveTab('speech')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'speech'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Voice & Speech</span>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tools & Modules</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personalization</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'data'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Data Controls</span>
            </button>
            {newTabs.map(([id, text, icon]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {icon}
                <span>{text}</span>
              </button>
            ))}
          </div>

          {/* Right Panel View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* 1. GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Interface & Languages
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Choose the language AURA uses for AI responses and voice
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onChangeLanguage(lang.code);
                          const speechCode = speechCodeForLanguage(lang.code);
                          femaleSpeech.saveSettings({ language: speechCode });
                          try { localStorage.setItem('aura_voice_language', speechCode); } catch {}
                          showToast(`Language switched to ${lang.name}`);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          currentLanguage === lang.code
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{lang.name}</div>
                          <div className="text-[10px] text-slate-400">{lang.native}</div>
                        </div>
                        {currentLanguage === lang.code && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Theme (Dark / Light Mode)</div>
                    <div className="text-[11px] text-slate-400">Toggle dark and light visual modes</div>
                  </div>
                  <button
                    onClick={onToggleTheme}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
                  </button>
                </div>
              </div>
            )}

            {/* 2. SPEECH & VOICE TAB */}
            {activeTab === 'speech' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Realistic Voice Engine (Voice Settings)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Ultra-realistic natural female voice tuning with real-time test
                  </p>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/30 border border-blue-200 dark:border-blue-900/60 mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-blue-950 dark:text-blue-200">
                        Test Voice Output
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Click to hear realistic female voice live
                      </div>
                    </div>
                    <button
                      onClick={handleTestVoiceAudio}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTestingVoice ? 'Speaking...' : 'Test Voice'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
                    <div className="text-xs font-bold mb-2">Voice style</div>
                    <div className="flex flex-wrap gap-2">
                      {([['female', 'Female'], ['male', 'Male'], ['neutral', 'Neutral']] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleVoiceSettingChange('voiceStyle', value)}
                          className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold border cursor-pointer ${
                            voiceSettings.voiceStyle === value
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-500'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold">Voice language</div>
                      <span className="text-[10px] text-slate-400">{voiceSettings.language}</span>
                    </div>
                    <select
                      value={voiceSettings.language}
                      onChange={(e) => handleVoiceSettingChange('language', e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer ${isDark ? 'bg-[#0b1322] border-[#253858]' : 'bg-slate-50 border-slate-200'}`}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={speechCodeForLanguage(lang.code)}>{lang.name} — {speechCodeForLanguage(lang.code)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span>Voice volume</span>
                      <span className="text-blue-600 font-bold">{Math.round((voiceSettings.volume ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={voiceSettings.volume ?? 1}
                      onChange={(e) => handleVoiceSettingChange('volume', parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>Realistic Studio Voice (Kore)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Recommended
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Uses human-timbre neural audio for crystal-clear natural speech
                      </div>
                    </div>
                    <button
                      onClick={() => handleVoiceSettingChange('useRealisticAI', !voiceSettings.useRealisticAI)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        voiceSettings.useRealisticAI ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        voiceSettings.useRealisticAI ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Speech Rate Slider */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Speaking Speed</span>
                      <span className="text-blue-600 font-bold">{voiceSettings.rate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.5"
                      step="0.05"
                      value={voiceSettings.rate}
                      onChange={(e) => handleVoiceSettingChange('rate', parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Slower (0.75x)</span>
                      <span>Natural (0.98x)</span>
                      <span>Faster (1.5x)</span>
                    </div>
                  </div>

                  {/* Pitch Slider */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Voice Tone / Pitch</span>
                      <span className="text-pink-600 font-bold">{voiceSettings.pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={voiceSettings.pitch}
                      onChange={(e) => handleVoiceSettingChange('pitch', parseFloat(e.target.value))}
                      className="w-full accent-pink-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Deeper</span>
                      <span>Natural Female (1.05)</span>
                      <span>Higher</span>
                    </div>
                  </div>

                  {/* Auto-Speak Responses */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold">Auto-Speak Responses</div>
                      <div className="text-[11px] text-slate-400">Automatically speaks the answer aloud when it arrives</div>
                    </div>
                    <button
                      onClick={() => handleVoiceSettingChange('autoSpeak', !voiceSettings.autoSpeak)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        voiceSettings.autoSpeak ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        voiceSettings.autoSpeak ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TOOLS & MODULES TAB */}
            {activeTab === 'tools' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Tools & Learning Modules
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Quickly launch useful tools for learning, research, and creation
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenQuiz?.();
                      }}
                      className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 text-left hover:border-purple-400 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 mb-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                        <ClipboardList className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Practice MCQ Test</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Adaptive objective practice with instant feedback
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenImageCreator?.();
                      }}
                      className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-left hover:border-indigo-400 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 mb-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Diagram Creator</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Generate science diagrams, circuits, and visual charts
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenQuickPrompt?.('Create a personalized learning plan for my current goal, available time, and preferred subjects.');
                      }}
                      className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-left hover:border-emerald-400 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <Calendar className="w-4 h-4" />
                        <span>Focus Plan</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ask AURA to generate a personalized learning plan
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. LEARNING & GOALS TAB */}
            {activeTab === 'learning' && (
              <div className="space-y-5">
                <PanelHead title="Learning & Goals" sub="Tell AURA the level and goal you want it to optimize for" />
                <Choice k="experienceLevel" label="Experience level" def="intermediate" options={[['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced'], ['expert', 'Expert']]} />
                <Choice k="primaryGoal" label="Primary goal" def="learn" options={[['learn', 'Learn'], ['research', 'Research'], ['create', 'Create'], ['code', 'Code'], ['solve', 'Solve problems']]} />
                <Toggle k="deepVerification" label="Deep verification" hint="Ask AURA to double-check calculations, claims, and source consistency when possible" def={true} />
                <Toggle k="autoSearchWhenUncertain" label="Search when uncertain" hint="Use web search when AURA lacks enough reliable information" def={true} />
              </div>
            )}

            {/* 5. PERSONALIZATION TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Profile
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    How AURA addresses you across conversations
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Display Name</label>
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${
                          isDark ? 'bg-[#0b1322] border-[#253858]' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. DATA CONTROLS */}
            {activeTab === 'data' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Data & History
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Manage session history stored on your local browser
                  </p>
                  <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-3">
                    <div className="text-xs font-bold text-red-700 dark:text-red-300">
                      Clear Current Chat History
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Deletes all messages and attachments from the active conversation.
                    </p>
                    <button
                      onClick={() => {
                        onClearChatHistory();
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Chat History</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NEW: PERSONALIZATION */}
            {activeTab === 'personalize' && (
              <div className="space-y-2">
                <PanelHead title="Personalization" sub="Tell AURA how you like answers" />
                <Choice k="responseStyle" label="Answer length" def="balanced" options={[['concise', 'Concise'], ['balanced', 'Balanced'], ['detailed', 'Detailed']]} />
                <Choice k="tone" label="Tone" def="friendly" options={[['friendly', 'Friendly'], ['formal', 'Formal'], ['motivating', 'Motivating'], ['strict teacher', 'Strict teacher']]} />
                <Toggle k="stepByStep" label="Step-by-step numericals" hint="Solve numerical problems one step at a time" def={true} />
                <Toggle k="showExamples" label="Include worked examples" def={true} />
                <div className="py-3">
                  <div className="text-xs font-bold mb-1">Custom instructions</div>
                  <textarea
                    rows={4}
                    maxLength={600}
                    value={prefs.customInstructions || ''}
                    onChange={(e) => setPref('customInstructions', e.target.value)}
                    placeholder="e.g. Explain with real-life examples. Always end with 3 practice questions."
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none resize-none ${isDark ? 'bg-[#0b1322] border-[#253858]' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <div className="text-[10px] text-slate-400 text-right">{(prefs.customInstructions || '').length}/600</div>
                </div>
              </div>
            )}

            {/* NEW: APPEARANCE & ACCESSIBILITY */}
            {activeTab === 'appearance' && (
              <div className="space-y-2">
                <PanelHead title="Appearance & Accessibility" sub="Make AURA comfortable to read" />
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold">Dark theme</div>
                  <button onClick={onToggleTheme} className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer">
                    {isDark ? 'Switch to light' : 'Switch to dark'}
                  </button>
                </div>
                <Choice k="fontSize" label="Text size" def="medium" options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} />
                <Toggle k="reduceMotion" label="Reduce motion" hint="Turns off animations" />
                <div className="py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold">Wide chat layout</div>
                    <div className="text-[11px] text-slate-500">Changes the chat width immediately</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !(prefs.wideChat ?? true);
                      setPref('wideChat', next);
                      onSetWideLayout?.(next);
                    }}
                    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
                      (prefs.wideChat ?? true) ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    role="switch" aria-checked={prefs.wideChat ?? true}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(prefs.wideChat ?? true) ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* NEW: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-2">
                <PanelHead title="Notifications" sub="Helpful reminders and tips (shown inside AURA)" />
                <Toggle k="notifyReminders" label="Daily reminders" def={true} />
                <Toggle k="notifyExam" label="Deadline countdown" hint="Shows time remaining for an optional personal deadline" />
                {(prefs.notifyExam ?? false) && (
                  <div className="py-3 border-b border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-bold mb-2">Deadline date</label>
                    <input
                      type="date"
                      value={prefs.examDate || ''}
                      onChange={(e) => setPref('examDate', e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDark ? 'bg-[#0b1322] border-[#253858]' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                )}
                <Toggle k="notifyTips" label="Daily productivity tip" hint="Shows a tip when AURA opens" />
                <Toggle k="soundEffects" label="Sound effects" hint="Controls AURA's listening/confirmation sounds" def={true} />
              </div>
            )}

            {/* NEW: PRIVACY & SECURITY */}
            {activeTab === 'privacy' && (
              <div className="space-y-2">
                <PanelHead title="Privacy & Security" sub="Your chats are stored only in this browser" />
                <Toggle k="saveHistory" label="Save chat history" hint="Turn off to stop saving new chats" def={true} />
                <div className="py-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([localStorage.getItem('aura_chat_sessions') || '[]'], { type: 'application/json' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = 'aura-chats.json';
                      a.click();
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer hover:border-blue-500"
                  >
                    Export my chats
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset all AURA settings on this device?')) {
                        localStorage.removeItem('aura_prefs');
                        localStorage.removeItem('aura_language');
                        localStorage.removeItem('aura_voice_settings');
                        localStorage.removeItem('aura_voice_language');
                        localStorage.removeItem('aura_voice_style');
                        localStorage.removeItem('aura_voice_auto_speak');
                        localStorage.removeItem('aura_theme');
                        setPrefs({});
                        onResetSettings?.();
                        showToast('All AURA settings were reset');
                      }
                    }}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Reset settings
                  </button>
                </div>
              </div>
            )}

            {/* NEW: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-2">
                <PanelHead title="About AURA" sub="Universal AI Workspace" />
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 py-2">
                  <p>AURA is a general-purpose AI workspace for learning, research, coding, creativity, web search, documents, images, and voice.</p>
                  <p>Answers are AI-generated and can contain mistakes - always double-check with your textbook.</p>
                  <p className="text-slate-400">Version 1.0</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
