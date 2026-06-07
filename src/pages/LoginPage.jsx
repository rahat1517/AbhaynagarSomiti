import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailPassword } from '../services/authService';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    type: '',
    message: '',
  });

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function getProfileByUserId(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_verified')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const loginData = await signInWithEmailPassword({
        email: form.email,
        password: form.password,
      });

      if (!loginData.user) {
        throw new Error('Login failed. User not found.');
      }

      await getProfileByUserId(loginData.user.id);

      setStatus({
        type: 'success',
        message: 'Login successful.',
      });

      navigate('/profile');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Login failed.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-5 shadow-soft md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
          Login
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Sign in to Portal
        </h1>

        

        {status.message ? (
          <StatusBox type={status.type} message={status.message} />
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email
            </span>

            <input
              type="email"
              value={form.email}
              required
              onChange={(event) => updateField('email', event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="your@email.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Password
            </span>

            <input
              type="password"
              value={form.password}
              required
              onChange={(event) => updateField('password', event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Your password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}

function StatusBox({ type, message }) {
  return (
    <div
      className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${
        type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  );
}