import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import LoginPage from "@/pages/auth/login"
import AdminLayout from "@/layout/adminLayout"
import Dashboard from "@/pages/admin/dashboard"
import Students from "@/pages/admin/students"
import StudentInfo from "@/pages/admin/studentInfo"
import UploadLogs from "@/pages/admin/uploadLogs"
import Attendance from "@/pages/admin/attendance"
import Archive from "@/pages/admin/archive"
import Anomalies from "@/pages/admin/anomalies"
import Reports from "@/pages/admin/reports"
import Settings from "@/pages/admin/setting"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:studentId" element={<StudentInfo />} />
          <Route path="upload" element={<UploadLogs />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="archive" element={<Archive />} />
          <Route path="anomalies" element={<Anomalies />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/admin/audit-logs" element={<Navigate to="/admin/settings?section=audit-logs" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
