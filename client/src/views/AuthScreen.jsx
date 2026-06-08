import { useState } from 'react';
import { KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';

export function AuthScreen({ auth }) {
  const [mode, setMode] = useState('guest');
  const [username, setUsername] = useState(localStorage.getItem('blackjack.guestName') ?? 'Casino Player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'guest') {
        auth.guestLogin(username);
      } else if (mode === 'login') {
        await auth.login(email, password);
      } else if (mode === 'register') {
        await auth.register(email, password, username);
        setMessage('Verification email sent.');
      } else if (mode === 'reset') {
        await auth.resetPassword(email);
        setMessage('Password reset email sent.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="flex min-h-[560px] flex-col justify-between rounded-md border border-brass/25 bg-ink/70 p-6 shadow-table backdrop-blur-xl sm:p-8">
          <div>
            <img src="/assets/chip.svg" alt="" className="h-16 w-16" />
            <h1 className="mt-6 text-4xl font-black text-ivory sm:text-6xl">AAA Blackjack</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/[0.64]">
              A real-time social Blackjack room with server-authoritative cards, premium casino tables, ranked progression, missions, and cosmetic rewards.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric value="7" label="Seats" />
            <Metric value="24s" label="Turn Timer" />
            <Metric value="3:2" label="Blackjack" />
          </div>
        </section>

        <section className="surface rounded-md p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <ModeButton active={mode === 'guest'} onClick={() => setMode('guest')} icon={LogIn} label="Guest" />
            <ModeButton active={mode === 'login'} onClick={() => setMode('login')} icon={KeyRound} label="Login" disabled={!auth.firebaseEnabled} />
            <ModeButton active={mode === 'register'} onClick={() => setMode('register')} icon={UserPlus} label="Register" disabled={!auth.firebaseEnabled} />
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'guest' || mode === 'register' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/70">Username</span>
                <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} minLength={2} maxLength={24} required />
              </label>
            ) : null}

            {mode !== 'guest' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/70">Email</span>
                <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
            ) : null}

            {mode === 'login' || mode === 'register' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/70">Password</span>
                <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
              </label>
            ) : null}

            {auth.authError ? <p className="rounded-md border border-ruby/40 bg-ruby/10 px-3 py-2 text-sm text-ruby">{auth.authError}</p> : null}
            {message ? <p className="rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm text-brass">{message}</p> : null}

            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {mode === 'guest' ? 'Enter Casino' : mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Send Reset'}
            </button>
          </form>

          {auth.firebaseEnabled ? (
            <button type="button" onClick={() => setMode('reset')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brass">
              <Mail className="h-4 w-4" />
              Reset password
            </button>
          ) : (
            <p className="mt-5 text-sm text-white/[0.48]">Firebase env is empty, so local guest mode is active.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function ModeButton({ active, disabled, onClick, icon: Icon, label }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={active ? 'btn btn-primary' : 'btn btn-secondary'}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Metric({ value, label }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-4">
      <p className="text-2xl font-black text-brass">{value}</p>
      <p className="text-sm text-white/55">{label}</p>
    </div>
  );
}
