import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Modus: 'login' | 'forgot' | 'reset'
// 'reset' wird aktiv wenn die Recovery-URL geöffnet wird (#type=recovery)
const detectMode = () =>
  window.location.hash.includes('type=recovery') ? 'reset' : 'login';

const LoginPage = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode,        setMode]        = useState(detectMode);
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);
  const [loading,     setLoading]     = useState(false);

  const from = location.state?.from?.pathname || '/';

  // Nur weiterleiten wenn NICHT im Reset-Modus (Recovery-Link)
  if (user && mode !== 'reset') {
    navigate(from, { replace: true });
    return null;
  }

  // ── Anmelden ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate(from, { replace: true });
  };

  // ── Passwort-Reset anfordern ──
  const handleForgot = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess('E-Mail gesendet. Bitte prüfe deinen Posteingang (auch Spam).');
  };

  // ── Neues Passwort setzen (nach Klick auf Reset-Link) ──
  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess('Passwort gesetzt! Du wirst weitergeleitet…');
    setTimeout(() => navigate('/'), 1500);
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm';
  const btnCls   = 'w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">SG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SG Hünstetten</h1>
          <p className="text-gray-500 mt-1">Buchungssystem</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

          {/* ── Anmelden ── */}
          {mode === 'login' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Anmelden</h2>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className={inputCls} placeholder="name@beispiel.de" required autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className={inputCls} placeholder="Passwort eingeben" required />
                </div>
                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? 'Anmelden...' : 'Anmelden'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                  className="text-sm text-blue-600 hover:text-blue-800">
                  Passwort vergessen?
                </button>
              </div>
            </>
          )}

          {/* ── Passwort vergessen ── */}
          {mode === 'forgot' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Passwort zurücksetzen</h2>
              <p className="text-sm text-gray-500 mb-4">Wir schicken dir einen Link per E-Mail.</p>
              {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}
              {!success && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className={inputCls} placeholder="name@beispiel.de" required autoFocus />
                  </div>
                  <button type="submit" disabled={loading} className={btnCls}>
                    {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
                  </button>
                </form>
              )}
              <div className="mt-4 text-center">
                <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                  className="text-sm text-blue-600 hover:text-blue-800">
                  ← Zurück zur Anmeldung
                </button>
              </div>
            </>
          )}

          {/* ── Neues Passwort setzen (Recovery-Link) ── */}
          {mode === 'reset' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Neues Passwort setzen</h2>
              <p className="text-sm text-gray-500 mb-4">Wähle ein sicheres Passwort für deinen Account.</p>
              {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}
              {!success && (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className={inputCls} placeholder="Mindestens 8 Zeichen" minLength={8} required autoFocus />
                  </div>
                  <button type="submit" disabled={loading} className={btnCls}>
                    {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
                  </button>
                </form>
              )}
            </>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Zugang nur für registrierte Benutzer. Kontaktiere deinen Administrator.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
