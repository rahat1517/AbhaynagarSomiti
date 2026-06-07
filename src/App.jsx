import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { supabase } from './lib/supabaseClient';
import { signOut } from './services/authService';

import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/profile/ProfilePage';

import DirectoryPage from './pages/directory/DirectoryPage';

import PrivacyDashboard from './pages/privacy/PrivacyDashboard';
import VisibilityPreferencesPage from './pages/privacy/VisibilityPreferencesPage';

import StudentCareerBoard from './pages/career/StudentCareerBoard';
import AlumniCareerDashboard from './pages/career/AlumniCareerDashboard';

import AdminVerificationDashboard from './pages/admin/AdminVerificationDashboard';
import AdminStudentVerificationPage from './pages/admin/AdminStudentVerificationPage';
import AdminRosterPage from './pages/admin/AdminRosterPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasAuthSession = Boolean(session?.user);
  const isLoggedIn = Boolean(session?.user && profile);
  const isAdmin = profile?.role === 'admin';
  const isVerified = profile?.is_verified === true;

  const navigationItems = useMemo(() => {
    if (!hasAuthSession) {
      return [
        { to: '/', label: 'Home' },
        { to: '/register', label: 'Register' },
        { to: '/login', label: 'Login' },
      ];
    }

    if (hasAuthSession && !profile && !loadingSession) {
      return [{ to: '/', label: 'Home' }];
    }

    if (!isLoggedIn) return [];

    const items = [
      { to: '/', label: 'Home' },
      { to: '/profile', label: 'Profile' },
    ];

    if (isVerified) {
      items.push(
        { to: '/directory', label: 'Directory' },
        { to: '/career/jobs', label: 'Jobs' },
        { to: '/career/alumni', label: 'Alumni Career' }
      );
    }

    items.push({ to: '/privacy/visibility', label: 'Visibility' });

    if (isAdmin) {
      items.push(
        { to: '/admin/verifications', label: 'Alumni Verify' },
        { to: '/admin/student-verifications', label: 'Student Verify' },
        { to: '/admin/roster', label: 'Roster' }
      );
    }

    return items;
  }, [hasAuthSession, isAdmin, isLoggedIn, isVerified, loadingSession, profile]);

  useEffect(() => {
    loadCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setLoadingSession(true);
      setSession(nextSession);

      if (nextSession?.user?.id) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }

      setLoadingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  async function loadCurrentSession() {
    setLoadingSession(true);

    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw new Error(error.message);
      }

      setSession(currentSession);

      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setSession(null);
      setProfile(null);
    } finally {
      setLoadingSession(false);
    }
  }

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_verified')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
      return;
    }

    if (!data) {
      console.warn('Auth user exists but profile row is missing.');
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  async function handleLogout() {
    try {
      await signOut();

      setSession(null);
      setProfile(null);
      setMobileMenuOpen(false);

      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-sm">
                DA
              </span>

              <span className="min-w-0">
                <span className="block truncate text-base font-black leading-tight text-slate-950 sm:text-lg">
                  Dhabi Abhaynagar Poribar
                </span>
                <span className="hidden text-xs font-semibold text-slate-500 sm:block">
                  Student Alumni Association
                </span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              {navigationItems.map((item) => (
                <NavItem key={item.to} to={item.to}>
                  {item.label}
                </NavItem>
              ))}

              {hasAuthSession && !profile && !loadingSession ? (
                <span className="whitespace-nowrap rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  Profile Missing
                </span>
              ) : null}

              {hasAuthSession ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-12 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              ) : null}

              {loadingSession ? (
                <span className="whitespace-nowrap px-3 text-xs font-semibold text-slate-400">
                  Loading...
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl lg:hidden">
              <div className="grid grid-cols-1 gap-2">
                {navigationItems.map((item) => (
                  <MobileNavItem key={item.to} to={item.to}>
                    {item.label}
                  </MobileNavItem>
                ))}

                {hasAuthSession && !profile && !loadingSession ? (
                  <span className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    Profile Missing
                  </span>
                ) : null}

                {hasAuthSession ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-12 w-full rounded-2xl bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    Logout
                  </button>
                ) : null}

                {loadingSession ? (
                  <span className="px-4 py-3 text-sm font-semibold text-slate-400">
                    Loading...
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/directory" element={<DirectoryPage />} />

        <Route path="/career/jobs" element={<StudentCareerBoard />} />
        <Route path="/career/alumni" element={<AlumniCareerDashboard />} />

        <Route path="/privacy" element={<PrivacyDashboard />} />

        <Route
          path="/privacy/visibility"
          element={<VisibilityPreferencesPage />}
        />

        <Route
          path="/admin/verifications"
          element={<AdminVerificationDashboard />}
        />

        <Route
          path="/admin/student-verifications"
          element={<AdminStudentVerificationPage />}
        />

        <Route path="/admin/roster" element={<AdminRosterPage />} />
      </Routes>
    </>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `min-h-12 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${
          isActive
            ? 'bg-slate-950 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function MobileNavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `min-h-12 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          isActive
            ? 'bg-slate-950 text-white shadow-sm'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
        }`
      }
    >
      {children}
    </NavLink>
  );
}