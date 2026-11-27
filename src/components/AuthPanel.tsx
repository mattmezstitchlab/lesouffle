import { useState, type FormEvent } from 'react';
import { LogIn, LogOut, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isCreator, isSupabaseConfigured, supabase } from '../lib/supabase';

export default function AuthPanel({ user, onClose }: { user: User | null; onClose?: () => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    setMessage(error ? error.message : 'Un lien de connexion vient d’être envoyé à cette adresse.');
  };

  if (user) {
    return (
      <div className="flex max-w-[320px] items-center gap-3 text-[12px]">
        <span className="hidden max-w-[180px] truncate text-smoke sm:block">{user.email}</span>
        {!isCreator(user) && <span className="hidden text-amber-700 sm:block">Seul le compte créateur peut modifier</span>}
        <button
          onClick={() => supabase?.auth.signOut()}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/30 px-3 py-1.5 font-semibold uppercase transition-colors hover:bg-ink hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Déconnexion
        </button>
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
        <form onSubmit={signIn} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="w-full rounded-full border border-line px-4 py-3 outline-none focus:border-ink" />
          <button disabled={busy} className="w-full cursor-pointer rounded-full bg-ink px-5 py-3 font-display text-sm font-semibold text-white uppercase disabled:cursor-wait disabled:opacity-50">
            {busy ? 'Envoi…' : 'Recevoir mon lien de connexion'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-smoke">{message}</p>}
      </div>
    </div>
  );
}
