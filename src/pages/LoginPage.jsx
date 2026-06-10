import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function handleSubmit(event) {
    event.preventDefault();

    setStatus({
      type: '',
      message: '',
    });

    if (!form.email.trim()) {
      setStatus({
        type: 'error',
        message: 'Email is required.',
      });
      return;
    }

    if (!form.password) {
      setStatus({
        type: 'error',
        message: 'Password is required.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInWithEmail(form.email, form.password);

      if (!result?.user) {
        throw new Error('Login failed. Please try again.');
      }

      const profile = result.profile;

      if (profile?.role === 'admin') {
        navigate('/admin/members');
      } else if (profile?.is_verified === true) {
        navigate('/directory');
      } else {
        navigate('/profile');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Login failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-600">
            Login
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Sign in to Portal
          </h1>

          {status.message ? (
            <div
              className={`mt-5 rounded-2xl border p-4 text-sm font-medium ${
                status.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">
                Email
              </span>

              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="your@email.com"
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">
                Password
              </span>

              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField('password', event.target.value)
                }
                placeholder="Enter password"
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm font-semibold text-slate-700">
              New to Dhabi Abhaynagar Poribar?
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Create an account to join the verified member community.
            </p>

            <Link
              to="/register"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
            >
              Register as a New Member
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}