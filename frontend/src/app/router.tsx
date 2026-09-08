import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AuthLayout } from "@/components/layout/auth-layout";
import { ProtectedRoute, PublicOnlyRoute } from "@/app/protected-route";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";

const LoginPage = lazy(() => import("@/features/auth/login-page"));
const RegisterPage = lazy(() => import("@/features/auth/register-page"));

const CandidateDashboard = lazy(() => import("@/features/candidate/dashboard-page"));
const ResumesPage = lazy(() => import("@/features/candidate/resumes-page"));
const NewInterviewPage = lazy(() => import("@/features/candidate/new-interview-page"));
const InterviewHistoryPage = lazy(() => import("@/features/candidate/interview-history-page"));
const SessionDetailPage = lazy(() => import("@/features/candidate/session-detail-page"));
const LiveInterviewRoom = lazy(() => import("@/features/candidate/live-interview-room"));
const ProfilePage = lazy(() => import("@/features/candidate/profile-page"));

const RecruiterDashboard = lazy(() => import("@/features/recruiter/dashboard-page"));
const RankingsPage = lazy(() => import("@/features/recruiter/rankings-page"));
const TemplatesPage = lazy(() => import("@/features/recruiter/templates-page"));
const BriefReviewPage = lazy(() => import("@/features/recruiter/brief-review-page"));
const SendInterviewPage = lazy(() => import("@/features/recruiter/send-interview-page"));
const RecruiterInterviewHistoryPage = lazy(() => import("@/features/recruiter/interview-history-page"));

const NotificationsPage = lazy(() => import("@/features/notifications/notifications-page"));
const InvitationsPage = lazy(() => import("@/features/candidate/invitations-page"));
const InvitationLandingPage = lazy(() => import("@/features/candidate/invitation-landing-page"));

const NotFoundPage = lazy(() => import("@/features/not-found-page"));

function Suspended({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function RoleLanding() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === "recruiter" || role === "admin") {
    return (
      <Suspended>
        <RecruiterDashboard />
      </Suspended>
    );
  }
  return (
    <Suspended>
      <CandidateDashboard />
    </Suspended>
  );
}

function RootRedirect() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return <Navigate to={accessToken ? "/app" : "/login"} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/invite/:token", element: <Suspended><InvitationLandingPage /></Suspended> },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <Suspended><LoginPage /></Suspended> },
          { path: "/register", element: <Suspended><RegisterPage /></Suspended> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={["candidate"]} />,
    children: [
      { path: "/room/:sessionId", element: <Suspended><LiveInterviewRoom /></Suspended> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/app", element: <RoleLanding /> },
          { path: "/notifications", element: <Suspended><NotificationsPage /></Suspended> },
          { path: "/app/profile", element: <Suspended><ProfilePage /></Suspended> },
          {
            element: <ProtectedRoute roles={["candidate"]} />,
            children: [
              { path: "/app/resumes", element: <Suspended><ResumesPage /></Suspended> },
              { path: "/app/interviews/new", element: <Suspended><NewInterviewPage /></Suspended> },
              { path: "/app/interviews", element: <Suspended><InterviewHistoryPage /></Suspended> },
              { path: "/app/interviews/:sessionId", element: <Suspended><SessionDetailPage /></Suspended> },
              { path: "/app/invitations", element: <Suspended><InvitationsPage /></Suspended> },
            ],
          },
          {
            element: <ProtectedRoute roles={["recruiter", "admin"]} />,
            children: [
              { path: "/app/rankings", element: <Suspended><RankingsPage /></Suspended> },
              { path: "/app/templates", element: <Suspended><TemplatesPage /></Suspended> },
              { path: "/app/brief-review", element: <Suspended><BriefReviewPage /></Suspended> },
              { path: "/app/send-interview", element: <Suspended><SendInterviewPage /></Suspended> },
              { path: "/app/interview-history", element: <Suspended><RecruiterInterviewHistoryPage /></Suspended> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Suspended><NotFoundPage /></Suspended> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}