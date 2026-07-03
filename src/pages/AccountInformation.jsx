import { Mail, ShieldCheck, UserCircle } from "lucide-react";

const AccountInformation = () => {
  return (
    <div data-aos="fade-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Account Information
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your current account details.
          </p>
        </div>

        <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          Admin Account
        </div>
      </div>

      <div className="mt-6 max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <UserCircle size={36} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-950">
              SPRYtech SOLUTIONS
            </h2>
            <p className="text-sm text-slate-500">Administrator</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Email</span>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              sprytechmail@gmail.com
            </p>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Role</span>
            </div>

            <p className="mt-3 text-sm text-slate-600">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInformation;
