import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
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

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const isLoggedIn = Boolean(session?.user);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
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

      if (currentSession?.user) {
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
      .single();

    if (error) {
      console.error('Failed to load profile:', error);
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

      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <>
      <nav className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/" className="text-sm font-bold text-slate-950">
            Abhaynagar Somiti
          </Link>

          <div className="flex items-center gap-1 overflow-x-auto">
            {!isLoggedIn ? (
              <>
                <NavItem to="/">Home</NavItem>
                <NavItem to="/register">Register</NavItem>
                <NavItem to="/login">Login</NavItem>
              </>
            ) : null}

            {isLoggedIn ? (
              <>
                <NavItem to="/">Home</NavItem>
                <NavItem to="/profile">Profile</NavItem>
                <NavItem to="/directory">Directory</NavItem>
                <NavItem to="/career/jobs">Jobs</NavItem>
                <NavItem to="/career/alumni">Alumni Career</NavItem>
                <NavItem to="/privacy">Privacy</NavItem>
                <NavItem to="/privacy/visibility">Visibility</NavItem>

                {isAdmin ? (
                  <>
                    <NavItem to="/admin/verifications">
                      Alumni Verify
                    </NavItem>

                    <NavItem to="/admin/student-verifications">
                      Student Verify
                    </NavItem>

                    <NavItem to="/admin/roster">Roster</NavItem>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-12 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : null}

            {loadingSession ? (
              <span className="whitespace-nowrap px-3 text-xs font-semibold text-slate-400">
                Loading...
              </span>
            ) : null}
          </div>
        </div>
      </nav>

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
    <Link
      to={to}
      className="min-h-12 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}