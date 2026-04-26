import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const BG_SVG = `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" fill="#0F1117"/>
  <rect x="0" y="380" width="800" height="120" fill="#0A0C10"/>
  <line x1="0" y1="380" x2="800" y2="380" stroke="#1E2330" stroke-width="1"/>
  <line x1="400" y1="380" x2="0"   y2="500" stroke="#1A1E28" stroke-width="0.5"/>
  <line x1="400" y1="380" x2="160" y2="500" stroke="#1A1E28" stroke-width="0.5"/>
  <line x1="400" y1="380" x2="320" y2="500" stroke="#1A1E28" stroke-width="0.5"/>
  <line x1="400" y1="380" x2="480" y2="500" stroke="#1A1E28" stroke-width="0.5"/>
  <line x1="400" y1="380" x2="640" y2="500" stroke="#1A1E28" stroke-width="0.5"/>
  <line x1="400" y1="380" x2="800" y2="500" stroke="#1A1E28" stroke-width="0.5"/>
  <line x1="0" y1="420" x2="800" y2="420" stroke="#1A1E28" stroke-width="0.5"/>
  <line x1="0" y1="460" x2="800" y2="460" stroke="#1A1E28" stroke-width="0.5"/>
  <rect x="20" y="140" width="14" height="240" fill="#1C2030"/>
  <rect x="130" y="140" width="14" height="240" fill="#1C2030"/>
  <rect x="20" y="140" width="124" height="8" fill="#232840"/>
  <rect x="20" y="210" width="124" height="8" fill="#232840"/>
  <rect x="20" y="280" width="124" height="8" fill="#232840"/>
  <rect x="20" y="350" width="124" height="8" fill="#232840"/>
  <rect x="25"  y="152" width="28" height="54" rx="2" fill="#2A3050"/>
  <rect x="57"  y="162" width="22" height="44" rx="2" fill="#243048"/>
  <rect x="83"  y="155" width="30" height="51" rx="2" fill="#2E3860"/>
  <rect x="117" y="158" width="20" height="48" rx="2" fill="#252E4A"/>
  <rect x="25"  y="222" width="32" height="52" rx="2" fill="#1E2A3A"/>
  <rect x="61"  y="228" width="24" height="46" rx="2" fill="#2A3858"/>
  <rect x="89"  y="220" width="28" height="54" rx="2" fill="#223048"/>
  <rect x="25"  y="292" width="26" height="52" rx="2" fill="#263450"/>
  <rect x="55"  y="295" width="30" height="49" rx="2" fill="#1E2C3E"/>
  <rect x="89"  y="290" width="22" height="54" rx="2" fill="#2A3858"/>
  <rect x="115" y="293" width="22" height="51" rx="2" fill="#243050"/>
  <rect x="0" y="200" width="12" height="180" fill="#252A38"/>
  <rect x="108" y="200" width="12" height="180" fill="#252A38"/>
  <rect x="0"  y="200" width="120" height="7" fill="#2E3448"/>
  <rect x="0"  y="260" width="120" height="7" fill="#2E3448"/>
  <rect x="0"  y="320" width="120" height="7" fill="#2E3448"/>
  <rect x="0"  y="373" width="120" height="7" fill="#2E3448"/>
  <rect x="4"  y="210" width="36" height="46" rx="2" fill="#3A4870"/>
  <rect x="44" y="214" width="28" height="42" rx="2" fill="#344268"/>
  <rect x="76" y="208" width="30" height="48" rx="2" fill="#3C4A72"/>
  <rect x="4"  y="270" width="30" height="46" rx="2" fill="#2E3C60"/>
  <rect x="38" y="275" width="36" height="41" rx="2" fill="#384468"/>
  <rect x="78" y="268" width="26" height="48" rx="2" fill="#304060"/>
  <rect x="4"  y="330" width="40" height="38" rx="2" fill="#3A4870"/>
  <rect x="48" y="333" width="28" height="35" rx="2" fill="#2C3A5C"/>
  <rect x="80" y="328" width="28" height="40" rx="2" fill="#364268"/>
  <rect x="656" y="140" width="14" height="240" fill="#1C2030"/>
  <rect x="766" y="140" width="14" height="240" fill="#1C2030"/>
  <rect x="656" y="140" width="124" height="8" fill="#232840"/>
  <rect x="656" y="210" width="124" height="8" fill="#232840"/>
  <rect x="656" y="280" width="124" height="8" fill="#232840"/>
  <rect x="656" y="350" width="124" height="8" fill="#232840"/>
  <rect x="660" y="152" width="28" height="54" rx="2" fill="#2A3050"/>
  <rect x="692" y="158" width="30" height="48" rx="2" fill="#2E3860"/>
  <rect x="726" y="155" width="22" height="51" rx="2" fill="#243048"/>
  <rect x="752" y="160" width="20" height="46" rx="2" fill="#252E4A"/>
  <rect x="660" y="222" width="26" height="52" rx="2" fill="#263450"/>
  <rect x="690" y="225" width="32" height="49" rx="2" fill="#1E2C3E"/>
  <rect x="726" y="220" width="24" height="54" rx="2" fill="#2A3858"/>
  <rect x="754" y="224" width="22" height="50" rx="2" fill="#243050"/>
  <rect x="660" y="292" width="30" height="52" rx="2" fill="#1E2A3A"/>
  <rect x="694" y="296" width="28" height="48" rx="2" fill="#2A3858"/>
  <rect x="726" y="290" width="22" height="54" rx="2" fill="#223048"/>
  <rect x="752" y="294" width="22" height="50" rx="2" fill="#1E2C3E"/>
  <rect x="680" y="200" width="12" height="180" fill="#252A38"/>
  <rect x="788" y="200" width="12" height="180" fill="#252A38"/>
  <rect x="680" y="200" width="120" height="7" fill="#2E3448"/>
  <rect x="680" y="260" width="120" height="7" fill="#2E3448"/>
  <rect x="680" y="320" width="120" height="7" fill="#2E3448"/>
  <rect x="680" y="373" width="120" height="7" fill="#2E3448"/>
  <rect x="684" y="210" width="36" height="46" rx="2" fill="#3A4870"/>
  <rect x="724" y="214" width="28" height="42" rx="2" fill="#344268"/>
  <rect x="756" y="208" width="30" height="48" rx="2" fill="#3C4A72"/>
  <rect x="684" y="270" width="30" height="46" rx="2" fill="#2E3C60"/>
  <rect x="718" y="275" width="36" height="41" rx="2" fill="#384468"/>
  <rect x="758" y="268" width="26" height="48" rx="2" fill="#304060"/>
  <rect x="684" y="330" width="40" height="38" rx="2" fill="#3A4870"/>
  <rect x="728" y="333" width="28" height="35" rx="2" fill="#2C3A5C"/>
  <rect x="760" y="328" width="28" height="40" rx="2" fill="#364268"/>
  <rect x="140" y="0" width="60" height="6" rx="2" fill="#2A3050"/>
  <rect x="350" y="0" width="60" height="6" rx="2" fill="#2A3050"/>
  <rect x="600" y="0" width="60" height="6" rx="2" fill="#2A3050"/>
  <polygon points="155,6 195,6 230,180 120,180" fill="#1A2035" opacity="0.4"/>
  <polygon points="365,6 405,6 440,200 330,200" fill="#1A2035" opacity="0.4"/>
  <polygon points="615,6 655,6 690,180 580,180" fill="#1A2035" opacity="0.4"/>
  <rect x="310" y="310" width="70" height="70" rx="3" fill="#1A2030"/>
  <rect x="295" y="340" width="20" height="40" rx="2" fill="#1C2235"/>
  <rect x="283" y="330" width="18" height="6" rx="1" fill="#232840"/>
  <rect x="283" y="345" width="18" height="6" rx="1" fill="#232840"/>
  <circle cx="320" cy="382" r="10" fill="#141820" stroke="#252A38" stroke-width="2"/>
  <circle cx="320" cy="382" r="4"  fill="#1E2430"/>
  <circle cx="362" cy="382" r="10" fill="#141820" stroke="#252A38" stroke-width="2"/>
  <circle cx="362" cy="382" r="4"  fill="#1E2430"/>
  <rect x="325" y="318" width="28" height="22" rx="2" fill="#1E304A" opacity="0.8"/>
  <rect x="430" y="355" width="80" height="8" rx="1" fill="#2A2010"/>
  <rect x="433" y="330" width="36" height="28" rx="2" fill="#3A3020"/>
  <rect x="473" y="335" width="32" height="23" rx="2" fill="#32281A"/>
  <rect x="436" y="310" width="30" height="22" rx="2" fill="#3C3222"/>
  <rect x="470" y="315" width="28" height="18" rx="2" fill="#2E2618"/>
  <rect x="0" y="30" width="800" height="4" rx="2" fill="#161A24" opacity="0.8"/>
  <rect x="200" y="0" width="3" height="90" fill="#161A24" opacity="0.6"/>
  <rect x="400" y="0" width="3" height="90" fill="#161A24" opacity="0.6"/>
  <rect x="600" y="0" width="3" height="90" fill="#161A24" opacity="0.6"/>
  <radialGradient id="fog" cx="50%" cy="60%" r="50%">
    <stop offset="0%"   stop-color="#1a2540" stop-opacity="0"/>
    <stop offset="100%" stop-color="#080A10" stop-opacity="0.7"/>
  </radialGradient>
  <rect x="0" y="0" width="800" height="500" fill="url(#fog)"/>
  <radialGradient id="spot" cx="50%" cy="45%" r="30%">
    <stop offset="0%"   stop-color="#2A3560" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="#080A10" stop-opacity="0"/>
  </radialGradient>
  <rect x="0" y="0" width="800" height="500" fill="url(#spot)"/>
</svg>`;

const BG_URL = `data:image/svg+xml;base64,${btoa(BG_SVG)}`;

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login }               = useAuthStore();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(email, password);
      // Redirect to role-specific dashboard
      navigate(response.dashboard_route || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fCls = "w-full text-sm px-3 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-white/50 text-white placeholder-white/30 transition-colors backdrop-blur-sm";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        backgroundImage: `url("${BG_URL}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0F1117',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      <div className="w-full max-w-sm">

        {/* Card — glassmorphism on dark bg */}
        <div
          className="rounded-md overflow-hidden"
          style={{
            background: 'rgba(15, 20, 35, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >

          {/* Brand */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h1 className="font-mono text-4xl font-semibold tracking-tight text-white leading-none mb-2">
              IMS
            </h1>
            <p className="font-mono text-xs tracking-widest uppercase"
               style={{ color: 'rgba(255,255,255,0.35)' }}>
              Inventory Management
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <p className="font-mono text-xs tracking-widest uppercase mb-5"
               style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sign in
            </p>

            {error && (
              <div className="bg-red-900/40 border border-red-500/30 text-red-300 font-mono text-xs px-3 py-2.5 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs uppercase tracking-widest"
                       style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs uppercase tracking-widest"
                       style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fCls}
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-mono text-xs font-medium py-2.5 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.9)', color: '#0F1117' }}
                >
                  {loading ? 'Signing in...' : 'Sign in →'}
                </button>
              </div>
            </form>
          </div>

          {/* Demo hint */}
          <div className="px-8 py-4 text-center"
               style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              admin@example.com / password
            </p>
          </div>

        </div>

        <p className="font-mono text-xs text-center mt-4 tracking-widest uppercase"
           style={{ color: 'rgba(255,255,255,0.15)' }}>
          Procurement System v1.0
        </p>

      </div>
    </div>
  );
}