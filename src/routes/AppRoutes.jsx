import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/Dashboard";
import AccountInformation from "../pages/AccountInformation";

const ComingSoon = ({ title }) => {
  return (
    <div data-aos="fade-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            This module will be added later.
          </p>
        </div>

        <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          Coming Soon
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{title} Module</h2>
        <p className="mt-2 text-sm text-slate-500">
          Dashboard first. We will build this page next.
        </p>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/account-information" element={<AccountInformation />} />

        <Route path="/students" element={<ComingSoon title="Students" />} />
        <Route path="/teachers" element={<ComingSoon title="Teachers" />} />
        <Route path="/classes" element={<ComingSoon title="Classes" />} />
        <Route path="/enrollment" element={<ComingSoon title="Enrollment" />} />
        <Route path="/attendance" element={<ComingSoon title="Attendance" />} />
        <Route path="/grades" element={<ComingSoon title="Grades" />} />
        <Route path="/payments" element={<ComingSoon title="Payments" />} />
        <Route path="/reports" element={<ComingSoon title="Reports" />} />
        <Route path="/settings" element={<ComingSoon title="Settings" />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
