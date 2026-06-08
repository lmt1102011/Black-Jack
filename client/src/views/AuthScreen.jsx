import { useState } from 'react';
import { KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';
import { assets } from '../lib/assets.js';

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
      <section className="surface w-full max-w-md rounded-md p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <img src={assets.chip} alt="" className="h-11 w-11" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black text-ivory">Sì Lát Royale</h1>
            <p className="text-xs font-semibold uppercase text-brass/80">Bàn bài trực tuyến</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-black/20 p-1">
          <ModeButton active={mode === 'guest'} onClick={() => setMode('guest')} icon={LogIn} label="Khách" />
          <ModeButton active={mode === 'login'} onClick={() => setMode('login')} icon={KeyRound} label="Đăng nhập" disabled={!auth.firebaseEnabled} />
          <ModeButton active={mode === 'register'} onClick={() => setMode('register')} icon={UserPlus} label="Tạo" disabled={!auth.firebaseEnabled} />
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'guest' || mode === 'register' ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-white/55">Tên chơi</span>
              <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} minLength={2} maxLength={24} required />
            </label>
          ) : null}

          {mode !== 'guest' ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-white/55">Email</span>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
          ) : null}

          {mode === 'login' || mode === 'register' ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-white/55">Mật khẩu</span>
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
            </label>
          ) : null}

          {auth.authError ? <p className="rounded-md border border-ruby/40 bg-ruby/10 px-3 py-2 text-sm text-ruby">{auth.authError}</p> : null}
          {message ? <p className="rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm text-brass">{message}</p> : null}

          <button type="submit" disabled={busy} className="btn btn-primary min-h-10 w-full">
            {mode === 'guest' ? 'Vào bàn' : mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Tạo tài khoản' : 'Gửi email'}
          </button>
        </form>

        {auth.firebaseEnabled ? (
          <button type="button" onClick={() => setMode('reset')} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase text-brass/85">
            <Mail className="h-4 w-4" />
            Quên mật khẩu
          </button>
        ) : (
          <p className="mt-4 text-xs text-white/[0.45]">Đang dùng chế độ khách.</p>
        )}
      </section>
    </main>
  );
}

function ModeButton({ active, disabled, onClick, icon: Icon, label }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={active ? 'btn btn-primary min-h-9 px-2 text-xs' : 'btn btn-secondary min-h-9 px-2 text-xs'}>
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </button>
  );
}
