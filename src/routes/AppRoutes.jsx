import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/Dashboard";
import AccountInformation from "../pages/AccountInformation";
import GradeSections from "../pages/GradeSections";
import Teachers from "../pages/Teachers";
import Students from "../pages/Students";
import Application from "../pages/Application";
import Verification from "../pages/Verification";
import ApplicantDetails from "../pages/ApplicantDetails";
import Login from "../pages/Login";
import StudentDetails from "../pages/StudentDetails";

const ComingSoon = ({ title }) => {
  return (
    <div data-aos="fade-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            This module will be added later.
          </p>
        </div>

        <div className="rounded-md bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
          Coming Soon
        </div>
      </div>

      <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-black text-slate-900">{title} Module</h2>
        <p className="mt-2 text-sm text-slate-500">
          We will build this page next.
        </p>
      </div>
    </div>
  );
};

const ProtectedRoute = () => {
  const token = localStorage.getItem("spry_auth_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/account-information" element={<AccountInformation />} />

          <Route path="/students" element={<Students />} />
          <Route path="/students/:studentId" element={<StudentDetails />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/classes" element={<GradeSections />} />

          <Route
            path="/enrollment"
            element={<Navigate to="/enrollment/application" replace />}
          />

          <Route path="/enrollment/application" element={<Application />} />
          <Route path="/enrollment/verification" element={<Verification />} />

          <Route
            path="/enrollment/verification/:registrationNumber"
            element={<ApplicantDetails />}
          />

          <Route
            path="/attendance"
            element={<ComingSoon title="Attendance" />}
          />
          <Route path="/grades" element={<ComingSoon title="Grades" />} />
          <Route path="/payments" element={<ComingSoon title="Payments" />} />
          <Route path="/reports" element={<ComingSoon title="Reports" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
