import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Breadcrumbs from "../components/layout/Breadcrumbs";

const AdminLayout = () => {
  const { pathname } = useLocation();
  const contentRef = useRef(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <Header />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />

        <main
          ref={contentRef}
          className="no-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 md:py-8"
        >
          <Breadcrumbs />

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
