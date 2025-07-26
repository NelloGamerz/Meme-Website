import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './pages/AuthPage';
import { MainPage } from './pages/MainPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ProfilePage } from './pages/ProfilePage';
import MemeDetailPage from './pages/MemeDetailPage';
import { ForgotPasswordForm } from './pages/ForgotPasswordForm';
import PasswordResetPage from './pages/password-reset';
import { Layout } from './components/layout/Layout';
import { ExplorePage } from './pages/ExplorePage';
import { CreatePage } from './pages/CreatePage';
import { UploadMemePage } from './pages/UploadMemePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { getCurrentTheme } from './utils/authHelpers';
import { WebSocketManager } from './components/websocket/WebSocketManager';
import { UserProfileInitializer } from './components/auth/UserProfileInitializer';
import { ThemeProvider } from './context/ThemeProvider';
import { ScrollToTop } from './utils/ScrollToTop';
import React from 'react';

const ProfilePageWrapper = () => {
  const { username } = useParams<{ username: string }>();
  return <ProfilePage key={username} />;
};

const RedirectToProfile = () => {
  const { username } = useParams<{ username: string }>();
  return <Navigate to={`/profile/${username}`} replace />;
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
};

const MemeDetailPageWrapper = () => {
  return (
    <Layout>
      <MemeDetailPage />
    </Layout>
  );
};

function App() {
  const location = useLocation();

  React.useEffect(() => {
    const htmlEl = document.documentElement;

    const lightOnlyRoutes = ['/auth', '/forgot-password', '/reset-password'];
    const isLightOnly = lightOnlyRoutes.some((route) =>
      location.pathname.startsWith(route)
    );

    htmlEl.classList.remove('light', 'dark', 'system');

    if (isLightOnly) {
      htmlEl.classList.add('light');
    } else {
      const savedTheme = getCurrentTheme();

      if (savedTheme === 'system' || !savedTheme) {
        htmlEl.classList.add('system');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlEl.classList.add(prefersDark ? 'dark' : 'light');
      } else {
        htmlEl.classList.add(savedTheme);
      }
    }
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <WebSocketManager />
      <UserProfileInitializer />
      <ScrollToTop />

      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/reset-password/:id" element={<PasswordResetPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <MainPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/meme/:id"
          element={<MemeDetailPageWrapper />}
        />
        <Route
          path="/explore"
          element={
            <ProtectedLayout>
              <ExplorePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedLayout>
              <CreatePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/upload-meme"
          element={
            <ProtectedLayout>
              <UploadMemePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedLayout>
              <NotificationsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <SettingsPage />
            </ProtectedLayout>
          }
        />

        <Route path="/api/profile/:username" element={<RedirectToProfile />} />
        <Route
          path="/profile/:username"
          element={
            <ProtectedLayout>
              <ProfilePageWrapper />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
