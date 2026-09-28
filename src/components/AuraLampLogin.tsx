import React, { useState } from 'react';
import { AURA_LAMP_IMAGE } from '../data/lampImage';

interface AuraLampLoginProps {
  onLoginSuccess: (username: string) => void;
}

export const AuraLampLogin: React.FC<AuraLampLoginProps> = ({ onLoginSuccess }) => {
  const [lampOn, setLampOn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const [welcomeLine] = useState(() => {
    const messages = [
      'Ready to learn something new?',
      'Your study space is ready.',
      'Let’s make today a learning day.',
      'AURA is ready when you are.',
      'Pick a topic and start exploring.',
      'Let’s turn questions into understanding.',
      'Your next breakthrough can start here.',
      'Time to power up your learning.',
      'Welcome to your AI study space.',
      'Let’s learn, practice, and improve.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  });

  const handleCordClick = () => {
    setLampOn((prev) => !prev);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lampOn) {
      // Nudge the user to pull the cord first
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onLoginSuccess(username.trim() || 'User');
  };

  return (
    <div className={`aura-lamp-login ${lampOn ? 'on' : ''}`}>
      <style>{`
        .aura-lamp-login {
          --bg:#07070A; --bg-on:#0A0D0A;
          --brass:#C9A15E; --brass-dim:#5A5142;
          --card:rgba(18,18,16,.55); --line:rgba(201,161,94,.18);
          --text:#F3EFE4; --sub:#9A9488;
          box-sizing:border-box;
          height:100vh;
          width:100%;
          margin:0;
          background:
            radial-gradient(ellipse 900px 600px at 30% 100%, rgba(90,60,20,.12), transparent),
            var(--bg);
          color:var(--text);font-family:'Inter',sans-serif;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
          padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);
          transition:background 1.2s ease;
          position:relative;
        }
        .aura-lamp-login *{box-sizing:border-box;}
        .aura-lamp-login.on{
          background:
            radial-gradient(ellipse 900px 600px at 30% 100%, rgba(111,191,126,.16), transparent),
            var(--bg-on);
        }
        .aura-lamp-login .vignette{
          position:fixed;inset:0;pointer-events:none;
          box-shadow:inset 0 0 180px rgba(0,0,0,.75);
          z-index:5;
        }
        .aura-lamp-login .stage{
          display:flex;align-items:center;gap:min(7vw,72px);
          width:min(780px,92vw);
        }
        .aura-lamp-login .lamp-wrap{
          position:relative;width:190px;height:340px;flex-shrink:0;
          display:flex;align-items:flex-end;justify-content:center;
        }
        .aura-lamp-login .glow{
          position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
          width:320px;height:320px;border-radius:50%;
          background:radial-gradient(circle,rgba(111,191,126,.4),transparent 65%);
          opacity:0;filter:blur(16px);transition:opacity 1.1s ease;
          pointer-events:none;
        }
        .aura-lamp-login.on .glow{opacity:1;}
        .aura-lamp-login .lamp-figure{
          position:relative;z-index:2;display:inline-block;line-height:0;
          filter:grayscale(.85) brightness(.4) saturate(.7);
          transition:filter 1s ease;
        }
        .aura-lamp-login.on .lamp-figure{
          filter:grayscale(0) brightness(1.06) saturate(1.15);
        }
        .aura-lamp-login .lamp-img{
          display:block;width:170px;height:auto;
          user-select:none;-webkit-user-drag:none;
        }
        .aura-lamp-login .mouth-mask{
          position:absolute;left:21.4%;top:29.2%;width:57.1%;height:20.8%;
          border-radius:50%;background:#3E6B4A;
          opacity:1;transition:opacity 1s ease;
        }
        .aura-lamp-login.on .mouth-mask{opacity:0;}
        .aura-lamp-login .cord{
          position:absolute;top:96px;left:66%;cursor:pointer;z-index:3;
          display:flex;flex-direction:column;align-items:center;
          transition:transform .15s ease;
          background:none;border:none;padding:0;
        }
        .aura-lamp-login .cord:active{transform:translateY(4px);}
        .aura-lamp-login .cord .string{width:1.5px;height:44px;background:var(--brass-dim);transition:background .8s ease;}
        .aura-lamp-login .cord .bead{
          width:9px;height:15px;border-radius:5px;
          background:linear-gradient(180deg,#D8B876,#8A6E3D);
          margin-top:-1px;box-shadow:0 0 6px rgba(201,161,94,.25);
        }
        .aura-lamp-login.on .cord .string{background:var(--brass);}
        .aura-lamp-login .card{
          position:relative;width:310px;padding:38px 30px;border-radius:0;
          background:var(--card);border:1px solid var(--line);
          backdrop-filter:blur(18px);
          box-shadow:0 0 0 rgba(111,191,126,0), 0 20px 50px rgba(0,0,0,.4);
          transition:border-color 1s ease, box-shadow 1s ease, opacity .7s ease;
          opacity:.4;
        }
        .aura-lamp-login.on .card{
          border-color:rgba(111,191,126,.55);
          box-shadow:0 0 40px rgba(111,191,126,.22), 0 20px 50px rgba(0,0,0,.4);
          opacity:1;
        }
        .aura-lamp-login .card.shake{ animation: aura-shake .4s ease; }
        @keyframes aura-shake {
          0%,100%{ transform:translateX(0); }
          25%{ transform:translateX(-6px); }
          75%{ transform:translateX(6px); }
        }
        .aura-lamp-login .eyebrow{
          font-size:11px;letter-spacing:.14em;color:var(--brass);margin:0 0 10px;
          opacity:.85;
        }
        .aura-lamp-login .card h2{
          font-family:'Cormorant Garamond',serif;font-weight:600;font-size:30px;margin:0 0 6px;
          letter-spacing:.01em;
          color:var(--text);
        }
        .aura-lamp-login .card p.sub{color:var(--sub);font-size:13px;margin:0 0 26px;line-height:1.5;}
        .aura-lamp-login .field{margin-bottom:16px;}
        .aura-lamp-login .field label{display:block;font-size:11px;letter-spacing:.04em;color:var(--sub);margin-bottom:7px;}
        .aura-lamp-login .field input{
          width:100%;padding:11px 2px;border:none;border-bottom:1px solid var(--line);
          background:transparent;color:var(--text);font-family:'Inter';font-size:14px;outline:none;
          transition:border-color .3s ease;
        }
        .aura-lamp-login .field input:focus{border-color:var(--brass);}
        .aura-lamp-login .go{
          width:100%;margin-top:14px;padding:13px;border:1px solid var(--brass-dim);border-radius:0;
          background:transparent;color:var(--sub);font-weight:500;font-size:13px;letter-spacing:.06em;
          transition:all .7s ease;cursor:pointer;
        }
        .aura-lamp-login.on .go{
          background:linear-gradient(90deg,#6FBF7E,#C9A15E);
          color:#0A0D0A;border-color:transparent;font-weight:600;
        }
        .aura-lamp-login .hint{margin-top:18px;font-size:11.5px;color:var(--sub);text-align:center;letter-spacing:.02em;}
        @media (max-width:560px){
          .aura-lamp-login .stage{flex-direction:column;gap:14px;}
          .aura-lamp-login .lamp-wrap{height:230px;width:150px;}
          .aura-lamp-login .lamp-img{width:130px;}
          .aura-lamp-login .cord{left:60%;}
        }
      `}</style>

      <div className="vignette" />
      <div className="stage">
        <div className="lamp-wrap">
          <div className="glow" />
          <div className="lamp-figure">
            <img className="lamp-img" src={AURA_LAMP_IMAGE} alt="AURA lamp" />
            <div className="mouth-mask" />
          </div>
          <button
            type="button"
            className="cord"
            onClick={handleCordClick}
            aria-label="Pull the cord to toggle the lamp"
          >
            <div className="string" />
            <div className="bead" />
          </button>
        </div>

        <form className={`card ${shake ? 'shake' : ''}`} onSubmit={handleLogin}>
          <p className="eyebrow">AURA</p>
          <h2>{welcomeLine}</h2>
          <p className="sub">Light the lamp, then step inside.</p>
          <div className="field">
            <label>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              disabled={!lampOn}
            />
          </div>
          <div className="field">
            <label>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              disabled={!lampOn}
            />
          </div>
          <button type="submit" className="go">Login</button>
          <div className="hint">
            {lampOn ? 'Lamp is lit — go ahead and log in' : 'Pull the cord — the lamp must be lit to log in'}
          </div>
        </form>
      </div>
    </div>
  );
};
