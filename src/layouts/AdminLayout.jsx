import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdminLayout = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <Header />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />

        <main className="no-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
