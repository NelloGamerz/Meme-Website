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
import { MessagingPage } from './pages/MessagingPage';
import { initializeTheme, getInMemoryTheme } from './store/useSettingsStore';
import { WebSocketManager } from './components/websocket/WebSocketManager';
// import { WebSocketEventHandler } from './components/websocket/WebSocketEventHandler';
import { WebSocketChatManager } from './components/websocket/WebSocketChatManager';
import { UserProfileInitializer } from './components/auth/UserProfileInitializer';
import { ThemeProvider } from './context/ThemeProvider';
import { ScrollToTop } from './utils/ScrollToTop';
import './utils/websocketMessageLogger'; // Initialize global WebSocket logger
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
    const applyTheme = async () => {
      const htmlEl = document.documentElement;

      const lightOnlyRoutes = ['/auth', '/forgot-password', '/reset-password'];
      const isLightOnly = lightOnlyRoutes.some((route) =>
        location.pathname.startsWith(route)
      );

      htmlEl.classList.remove('light', 'dark');

      if (isLightOnly) {
        htmlEl.classList.add('light');
      } else {
        try {
          await initializeTheme();
          
          const savedTheme = getInMemoryTheme();

          if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            htmlEl.classList.add(savedTheme);
          } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlEl.classList.add(prefersDark ? 'dark' : 'light');
          }
        } catch (error) {
          console.error('Failed to get theme:', error);
          htmlEl.classList.add('light');
        }
      }
    };

    applyTheme();
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <WebSocketManager />
      <WebSocketChatManager />
      {/* <WebSocketEventHandler /> */}
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
        <Route
          path="/messages"
          element={
            <ProtectedLayout>
              <MessagingPage />
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
