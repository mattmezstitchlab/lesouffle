import { useState, type FormEvent } from 'react';
import { LogIn, LogOut, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isCreator, isSupabaseConfigured, supabase } from '../lib/supabase';

export default function AuthPanel({ user, onClose }: { user: User | null; onClose?: () => void }) {
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setCodeSent(true);
    setMessage('Un code à 6 chiffres vient d’être envoyé à cette adresse.');
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !email.trim() || token.trim().length !== 6) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    setBusy(false);
    setMessage(error ? error.message : 'Connexion réussie.');
  };

  if (user) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/30 p-5 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-[24px] bg-white p-7 shadow-2xl">
          {onClose && <button onClick={onClose} aria-label="Fermer" className="absolute right-5 top-5 cursor-pointer"><X className="h-5 w-5" /></button>}
          <LogIn className="mb-5 h-6 w-6" />
          <p className="mb-2 font-display text-[12px] font-semibold tracking-[0.12em] text-smoke uppercase">Mon compte</p>
          <h2 className="mb-3 font-display text-3xl font-bold tracking-[-0.04em]">Vous êtes connecté</h2>
          <p className="mb-5 break-all text-sm text-smoke">{user.email}</p>
          <p className="mb-6 rounded-2xl bg-[#f5f5f5] p-4 text-sm leading-6 text-smoke">
            {isCreator(user)
              ? 'Compte créateur : vous pouvez modifier le livre, la timeline et le programme.'
              : 'Ce compte peut consulter le site, mais seul le compte créateur peut modifier son contenu.'}
          </p>
          <button
            onClick={() => { void supabase?.auth.signOut(); onClose?.(); }}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-ink/30 px-3 py-3 font-semibold uppercase transition-colors hover:bg-ink hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Déconnexion
          </button>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return <span className="text-[12px] text-smoke">Connexion non configurée</span>;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/30 p-5 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[24px] bg-white p-7 shadow-2xl">
        {onClose && <button onClick={onClose} aria-label="Fermer" className="absolute right-5 top-5 cursor-pointer"><X className="h-5 w-5" /></button>}
        <LogIn className="mb-5 h-6 w-6" />
        <p className="mb-2 font-display text-[12px] font-semibold tracking-[0.12em] text-smoke uppercase">Espace privé</p>
        <h2 className="mb-3 font-display text-3xl font-bold tracking-[-0.04em]">Connectez-vous pour modifier</h2>
        <p className="mb-6 text-sm leading-6 text-smoke">Vos modifications du livre et de la timeline seront liées à votre compte et disponibles sur vos autres appareils.</p>
        <form onSubmit={codeSent ? verifyCode : sendCode} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="w-full rounded-full border border-line px-4 py-3 outline-none focus:border-ink" />
          {codeSent && (
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="Code à 6 chiffres"
              className="w-full rounded-full border border-line px-4 py-3 text-center tracking-[0.3em] outline-none focus:border-ink"
            />
          )}
          <button disabled={busy} className="w-full cursor-pointer rounded-full bg-ink px-5 py-3 font-display text-sm font-semibold text-white uppercase disabled:cursor-wait disabled:opacity-50">
            {busy ? (codeSent ? 'Vérification…' : 'Envoi…') : codeSent ? 'Valider le code' : 'Recevoir mon code de connexion'}
          </button>
        </form>
        {codeSent && <button type="button" onClick={() => { setCodeSent(false); setToken(''); setMessage(''); }} className="mt-3 w-full cursor-pointer text-sm text-smoke underline">Changer d’adresse</button>}
        {message && <p className="mt-4 text-sm text-smoke">{message}</p>}
      </div>
    </div>
  );
}
