import { BrowserRouter, Routes, Route } from "react-router-dom";

// Private Route
import Dashboard from "./pages/Dashboard/index";
import ProjectsPage from "./pages/Projects/index";
import JoinLinkPage from "./pages/Joining/index";
import CalendarPage from "./pages/Calendar/index";
import TrashPage from "./pages/Trash/TrashPage";

import { EmptyInputGroup } from "./pages/404/index";
import ProjectPage from "./pages/Task/index";
import ProfilePage from "./pages/profile/index";
import SetupWorkspace from "./pages/SetupWorkspace/index";

// Public Route
import LoginPage from "./pages/Auth/login/index";
import RegisterPage from "./pages/Auth/register/index";
import OTPPage from "./pages/Auth/otp";
import OAuthCallbackPage from "./pages/Auth/oauth-callback/index";

//Route Root
import { ProtectedRoute } from "./components/rooting/protect-route";
import { RootRedirect } from "./components/rooting/rootRedirect";
import { GuestRoute } from "./components/rooting/guestRoot";

import { Toaster } from "sonner";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./components/theme-provider";
import { ChatPanel } from "./components/chat/ChatPanel";
import { CustomCursor } from "./components/custom-cursor";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
          {/* Public routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <GuestRoute>
                <OTPPage />
              </GuestRoute>
            }
          />
          <Route
            path="/auth/callback"
            element={
              <GuestRoute>
                <OAuthCallbackPage />
              </GuestRoute>
            }
          />

          {/* Protected routes - hanya bisa diakses jika sudah login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/projects/join-link/:projectId" element={<ProtectedRoute><JoinLinkPage /></ProtectedRoute>} />
          <Route path="/projects/join/:projectId" element={<ProtectedRoute><JoinLinkPage /></ProtectedRoute>} />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/tasks/:taskId"
            element={
              <ProtectedRoute>
                <ProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <TrashPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup-workspace"
            element={
              <ProtectedRoute>
                <SetupWorkspace />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<EmptyInputGroup />} />
        </Routes>
        <ChatPanel />
        <CustomCursor />
      </BrowserRouter>
          <Toaster position="top-right" />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;