import { useState } from 'react';
import { updateMyVisibilityPreferences } from '../../services/directoryService';

export default function VisibilityPreferencesPage() {
  const [form, setForm] = useState({
    showEmail: false,
    showContactNumber: false,
    contactVisibility: 'private',
  });

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await updateMyVisibilityPreferences(form);

      setStatus({
        type: 'success',
        message: result.message || 'Preferences updated.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to update preferences.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-5 shadow-soft md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
          Privacy
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Directory Visibility Preferences
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Control whether other verified directory members can see your email
          and encrypted contact number.
        </p>

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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.showEmail}
                onChange={(event) =>
                  updateField('showEmail', event.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
              />

              <span>
                <span className="block text-sm font-bold text-slate-900">
                  Show email in directory details
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  Your email will be visible only to verified members and admins.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.showContactNumber}
                onChange={(event) =>
                  updateField('showContactNumber', event.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
              />

              <span>
                <span className="block text-sm font-bold text-slate-900">
                  Show contact number
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  Contact number is stored encrypted and revealed only if this
                  setting and role visibility allow it.
                </span>
              </span>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Contact visibility rule
            </span>

            <select
              value={form.contactVisibility}
              onChange={(event) =>
                updateField('contactVisibility', event.target.value)
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="private">Private</option>
              <option value="verified_members">Verified members</option>
              <option value="students_only">Students only</option>
              <option value="alumni_only">Alumni only</option>
              <option value="public_to_directory">Public to directory</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </section>
    </main>
  );
}