import { useEffect, useRef, useState } from "react";
import { LogOut, User, UserCircle } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import spryIcon from "../assets/Sprytechicon.webp";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Log out?",
      text: "Are you sure you want to log out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, log out",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#fb920e",
    });

    if (!result.isConfirmed) return;

    try {
      await logout();
      toast.success("Logged out successfully");
      setIsAccountOpen(false);
      window.location.href = "/login";
    } catch {
      toast.error("Unable to log out. Please try again.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6 md:px-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={spryIcon}
            alt="SPRYtech Icon"
            className="h-11 w-11 shrink-0 object-contain"
          />

          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-950 sm:text-xl">
              School Management System
            </h1>
            <p className="truncate text-xs font-medium text-slate-500">
              SPRYtech Solutions
            </p>
          </div>
        </div>

        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsAccountOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <User size={21} />
          </button>

          {isAccountOpen && (
            <div className="absolute right-0 top-14 w-80 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-sm font-black text-slate-950">
                  {user?.name || "Account"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {user?.email || ""}
                </p>
              </div>

              <div className="p-2">
                <a
                  href="/account-information"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <UserCircle size={20} className="text-slate-500" />
                  Account Information
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={20} className="text-slate-500" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
