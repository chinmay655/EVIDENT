import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";

import {
  About,
  HowItWorks,
  FAQ,
  Privacy,
  Terms,
  RefundPolicy,
  NotFound,
} from "@/pages/StaticPages";

import Contact from "@/pages/Contact";
import Verify from "@/pages/Verify";
import PublicPortfolio from "@/pages/PublicPortfolio";
import PublicEvidence from "@/pages/PublicEvidence";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

import StudentDashboard from "@/pages/student/StudentDashboard";
import Enroll from "@/pages/student/Enroll";
import Enrollments from "@/pages/student/Enrollments";
import WorkspaceHome from "@/pages/student/WorWokspaceHome";
import Workspace from "@/pages/student/Workspace";
import Submissions from "@/pages/student/Submissions";
import Profile from "@/pages/student/Profile";
import Notifications from "@/pages/student/Notifications";
import Certificates from "@/pages/student/Certificates";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminProjectEditor from "@/pages/admin/AdminProjectEditor";
import AdminEnrollments from "@/pages/admin/AdminEnrollments";
import AdminEnrollmentDetail from "@/pages/admin/AdminEnrollmentDetail";
import AdminSubmissions from "@/pages/admin/AdminSubmissions";
import AdminSubmissionReview from "@/pages/admin/AdminSubmissionReview";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminCertificates from "@/pages/admin/AdminCertificates";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminAudit from "@/pages/admin/AdminAudit";

function S({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function A({ children }) {
  return <ProtectedRoute admin>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />

          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          <Route path="/verify/:verificationId" element={<Verify />} />
          <Route path="/verify" element={<Verify />} />

          <Route
            path="/students/:username"
            element={<PublicPortfolio />}
          />

          <Route
            path="/evidence/:publicId"
            element={<PublicEvidence />}
          />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* Student */}
          <Route
            path="/dashboard"
            element={
              <S>
                <StudentDashboard />
              </S>
            }
          />

          <Route
            path="/enrollments"
            element={
              <S>
                <Enrollments />
              </S>
            }
          />

          <Route
            path="/enroll/:slug"
            element={
              <S>
                <Enroll />
              </S>
            }
          />

          <Route
            path="/workspace"
            element={
              <S>
                <WorkspaceHome />
              </S>
            }
          />

          <Route
            path="/workspace/:enrollmentId"
            element={
              <S>
                <Workspace />
              </S>
            }
          />

          <Route
            path="/submissions"
            element={
              <S>
                <Submissions />
              </S>
            }
          />

          <Route
            path="/profile"
            element={
              <S>
                <Profile />
              </S>
            }
          />

          <Route
            path="/notifications"
            element={
              <S>
                <Notifications />
              </S>
            }
          />

          <Route
            path="/certificates"
            element={
              <S>
                <Certificates />
              </S>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <A>
                <AdminDashboard />
              </A>
            }
          />

          <Route
            path="/admin/projects"
            element={
              <A>
                <AdminProjects />
              </A>
            }
          />

          <Route
            path="/admin/projects/new"
            element={
              <A>
                <AdminProjectEditor />
              </A>
            }
          />

          <Route
            path="/admin/projects/:id/edit"
            element={
              <A>
                <AdminProjectEditor />
              </A>
            }
          />

          <Route
            path="/admin/enrollments"
            element={
              <A>
                <AdminEnrollments />
              </A>
            }
          />

          <Route
            path="/admin/enrollments/:id"
            element={
              <A>
                <AdminEnrollmentDetail />
              </A>
            }
          />

          <Route
            path="/admin/submissions"
            element={
              <A>
                <AdminSubmissions />
              </A>
            }
          />

          <Route
            path="/admin/submissions/:id"
            element={
              <A>
                <AdminSubmissionReview />
              </A>
            }
          />

          <Route
            path="/admin/students"
            element={
              <A>
                <AdminStudents />
              </A>
            }
          />

          <Route
            path="/admin/certificates"
            element={
              <A>
                <AdminCertificates />
              </A>
            }
          />

          <Route
            path="/admin/questions"
            element={
              <A>
                <AdminQuestions />
              </A>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <A>
                <AdminAudit />
              </A>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}