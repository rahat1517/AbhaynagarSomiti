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
import { getAdminNotificationSummary } from './services/adminMemberService';

import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/profile/ProfilePage';

import DirectoryPage from './pages/directory/DirectoryPage';

import PrivacyDashboard from './pages/privacy/PrivacyDashboard';
import VisibilityPreferencesPage from './pages/privacy/VisibilityPreferencesPage';

import StudentCareerBoard from './pages/career/StudentCareerBoard';
import AlumniCareerDashboard from './pages/career/AlumniCareerDashboard';

import AdminMemberVerificationPage from './pages/admin/AdminMemberVerificationPage';
import AdminMemberUpdateRequestsPage from './pages/admin/AdminMemberUpdateRequestsPage';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [adminNotifications, setAdminNotifications] = useState({
    pendingMembers: 0,
    pendingUpdates: 0,
    total: 0,
  });

  const hasAuthSession = Boolean(session?.user);
  const isLoggedIn = Boolean(session?.user && profile);
  const isAdmin = profile?.role === 'admin';
  const isVerified = profile?.is_verified === true;

  useEffect(() => {
    loadCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setLoadingSession(true);
      setSession(nextSession);

      if (nextSession?.user?.id) {
        const nextProfile = await loadProfile(nextSession.user.id);

        if (nextProfile?.role === 'admin') {
          await loadAdminNotifications();
        } else {
          resetAdminNotifications();
        }
      } else {
        setProfile(null);
        resetAdminNotifications();
      }

      setLoadingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    loadAdminNotifications();

    const intervalId = window.setInterval(() => {
      loadAdminNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAdmin]);

  function resetAdminNotifications() {
    setAdminNotifications({
      pendingMembers: 0,
      pendingUpdates: 0,
      total: 0,
    });
  }

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
        const nextProfile = await loadProfile(currentSession.user.id);

        if (nextProfile?.role === 'admin') {
          await loadAdminNotifications();
        }
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
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_verified')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
      return null;
    }

    if (!data) {
      console.warn('Auth user exists but profile row is missing.');
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }

  async function loadAdminNotifications() {
    try {
      const summary = await getAdminNotificationSummary();
      setAdminNotifications(summary);
    } catch (error) {
      console.error('Failed to load admin notifications:', error);
      resetAdminNotifications();
    }
  }

  async function handleLogout() {
    try {
      await signOut();

      setSession(null);
      setProfile(null);
      setMobileMenuOpen(false);
      resetAdminNotifications();

      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="text-sm font-bold text-slate-950"
          >
            Dhabi Abhaynagar Poribar
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <NavLinks
              hasAuthSession={hasAuthSession}
              isLoggedIn={isLoggedIn}
              isVerified={isVerified}
              isAdmin={isAdmin}
              loadingSession={loadingSession}
              profile={profile}
              adminNotifications={adminNotifications}
              onLogout={handleLogout}
              onNavigate={closeMobileMenu}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 md:hidden"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? (
              <span className="text-2xl leading-none">×</span>
            ) : (
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-6 rounded-full bg-slate-900" />
                <span className="block h-0.5 w-6 rounded-full bg-slate-900" />
                <span className="block h-0.5 w-6 rounded-full bg-slate-900" />
              </span>
            )}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-lg md:hidden">
            <div className="grid grid-cols-1 gap-2">
              <NavLinks
                hasAuthSession={hasAuthSession}
                isLoggedIn={isLoggedIn}
                isVerified={isVerified}
                isAdmin={isAdmin}
                loadingSession={loadingSession}
                profile={profile}
                adminNotifications={adminNotifications}
                onLogout={handleLogout}
                onNavigate={closeMobileMenu}
                mobile
              />
            </div>
          </div>
        ) : null}
      </nav>

      {isAdmin && adminNotifications.total > 0 ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm font-semibold text-amber-800 md:flex-row md:items-center md:justify-between">
            <span>
              Admin notification: {adminNotifications.pendingMembers} new
              registration(s), {adminNotifications.pendingUpdates} update
              request(s).
            </span>

            <Link
              to="/admin/members"
              onClick={closeMobileMenu}
              className="w-fit rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
            >
              Review Now
            </Link>
          </div>
        </div>
      ) : null}

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
          path="/admin/members"
          element={<AdminMemberVerificationPage />}
        />

        <Route
          path="/admin/member-updates"
          element={<AdminMemberUpdateRequestsPage />}
        />

        <Route path="/admin/roster" element={<AdminRosterPage />} />
      </Routes>
    </>
  );
}

function NavLinks({
  hasAuthSession,
  isLoggedIn,
  isVerified,
  isAdmin,
  loadingSession,
  profile,
  adminNotifications,
  onLogout,
  onNavigate,
  mobile = false,
}) {
  const itemClass = mobile
    ? 'min-h-11 w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100'
    : 'min-h-12 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100';

  if (!hasAuthSession) {
    return (
      <>
        <NavItem to="/" className={itemClass} onClick={onNavigate}>
          Home
        </NavItem>

        <NavItem to="/register" className={itemClass} onClick={onNavigate}>
          Register
        </NavItem>

        <NavItem to="/login" className={itemClass} onClick={onNavigate}>
          Login
        </NavItem>

        {loadingSession ? (
          <span className="px-3 text-xs font-semibold text-slate-400">
            Loading...
          </span>
        ) : null}
      </>
    );
  }

  if (hasAuthSession && !profile && !loadingSession) {
    return (
      <>
        <NavItem to="/" className={itemClass} onClick={onNavigate}>
          Home
        </NavItem>

        <span className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Profile Missing
        </span>

        <button
          type="button"
          onClick={onLogout}
          className={`${itemClass} text-red-600 hover:bg-red-50`}
        >
          Logout
        </button>
      </>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <NavItem to="/" className={itemClass} onClick={onNavigate}>
        Home
      </NavItem>

      <NavItem to="/profile" className={itemClass} onClick={onNavigate}>
        Profile
      </NavItem>

      {isVerified ? (
        <>
          <NavItem to="/directory" className={itemClass} onClick={onNavigate}>
            Directory
          </NavItem>

          <NavItem to="/career/jobs" className={itemClass} onClick={onNavigate}>
            Jobs
          </NavItem>

          <NavItem
            to="/career/alumni"
            className={itemClass}
            onClick={onNavigate}
          >
            Alumni Career
          </NavItem>
        </>
      ) : null}

      {/* <NavItem to="/privacy" className={itemClass} onClick={onNavigate}>
        Privacy
      </NavItem>

      <NavItem
        to="/privacy/visibility"
        className={itemClass}
        onClick={onNavigate}
      >
        Visibility
      </NavItem> */}

      {isAdmin ? (
        <>
          <NavItem to="/admin/members" className={itemClass} onClick={onNavigate}>
            <span className="inline-flex items-center gap-2">
              Member Verify
              {adminNotifications.pendingMembers > 0 ? (
                <Badge count={adminNotifications.pendingMembers} />
              ) : null}
            </span>
          </NavItem>

          <NavItem
            to="/admin/member-updates"
            className={itemClass}
            onClick={onNavigate}
          >
            <span className="inline-flex items-center gap-2">
              Update Requests
              {adminNotifications.pendingUpdates > 0 ? (
                <Badge count={adminNotifications.pendingUpdates} />
              ) : null}
            </span>
          </NavItem>

          <NavItem to="/admin/roster" className={itemClass} onClick={onNavigate}>
            Roster
          </NavItem>
        </>
      ) : null}

      <button
        type="button"
        onClick={onLogout}
        className={`${itemClass} text-red-600 hover:bg-red-50`}
      >
        Logout
      </button>

      {loadingSession ? (
        <span className="px-3 text-xs font-semibold text-slate-400">
          Loading...
        </span>
      ) : null}
    </>
  );
}

function NavItem({ to, children, className, onClick }) {
  return (
    <Link to={to} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

function Badge({ count }) {
  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-black text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}