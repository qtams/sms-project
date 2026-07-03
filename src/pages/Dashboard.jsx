import {
  FiActivity,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiLayers,
  FiUsers,
} from "react-icons/fi";
import { PiChalkboardTeacher, PiStudent } from "react-icons/pi";
import { MdOutlineSchool } from "react-icons/md";

const brand = {
  orange: "#fb920e",
  darkOrange: "#ee680c",
  cyan: "#03a4d3",
  blueTeal: "#0e6f99",
  brightCyan: "#1bcaee",
  softOrange: "#fff3e5",
  softCyan: "#e9fbff",
  softBlue: "#e8f7fc",
  softTeal: "#e8fbfd",
};

const Dashboard = () => {
  const statCards = [
    {
      label: "Active Users",
      value: "1",
      description: "Currently online",
      icon: FiActivity,
      color: brand.cyan,
      bg: brand.softCyan,
    },
    {
      label: "Total Modules",
      value: "10",
      description: "+2 this month",
      icon: FiLayers,
      color: brand.orange,
      bg: brand.softOrange,
    },
    {
      label: "Schools",
      value: "5",
      description: "Active schools",
      icon: MdOutlineSchool,
      color: brand.blueTeal,
      bg: brand.softBlue,
    },
    {
      label: "Teachers",
      value: "28",
      description: "Active teachers",
      icon: PiChalkboardTeacher,
      color: brand.darkOrange,
      bg: brand.softOrange,
    },
    {
      label: "Students",
      value: "320",
      description: "Enrolled students",
      icon: PiStudent,
      color: brand.cyan,
      bg: brand.softCyan,
    },
    {
      label: "Classes",
      value: "18",
      description: "Active sections",
      icon: FiBookOpen,
      color: brand.blueTeal,
      bg: brand.softBlue,
    },
    {
      label: "Attendance",
      value: "89%",
      description: "Present today",
      icon: FiCalendar,
      color: brand.brightCyan,
      bg: brand.softTeal,
    },
    {
      label: "Payments",
      value: "42",
      description: "Pending balances",
      icon: FiCreditCard,
      color: brand.orange,
      bg: brand.softOrange,
    },
    {
      label: "Enrollments",
      value: "12",
      description: "Pending review",
      icon: FiClipboard,
      color: brand.darkOrange,
      bg: brand.softOrange,
    },
    {
      label: "Reports",
      value: "6",
      description: "Generated this week",
      icon: FiFileText,
      color: brand.blueTeal,
      bg: brand.softBlue,
    },
  ];

  const enrollmentData = [
    { month: "Jan", students: 120, attendance: 95 },
    { month: "Feb", students: 145, attendance: 110 },
    { month: "Mar", students: 135, attendance: 105 },
    { month: "Apr", students: 180, attendance: 145 },
    { month: "May", students: 215, attendance: 175 },
    { month: "Jun", students: 240, attendance: 195 },
  ];

  const gradeData = [
    { name: "Grade 7", value: 82 },
    { name: "Grade 8", value: 76 },
    { name: "Grade 9", value: 65 },
    { name: "Grade 10", value: 57 },
  ];

  const modules = [
    {
      title: "Enrollment",
      description: "Review and approve new student applications.",
      icon: FiClipboard,
      color: brand.orange,
      bg: brand.softOrange,
    },
    {
      title: "Attendance",
      description: "Monitor daily attendance by grade and section.",
      icon: FiCalendar,
      color: brand.cyan,
      bg: brand.softCyan,
    },
    {
      title: "Grades",
      description: "Track quizzes, exams, activities, and final grades.",
      icon: FiBookOpen,
      color: brand.blueTeal,
      bg: brand.softBlue,
    },
  ];

  const activities = [
    {
      title: "New enrollment request",
      description: "Maria Santos submitted Grade 8 enrollment.",
      time: "10 mins ago",
    },
    {
      title: "Attendance updated",
      description: "Grade 7 - Section A attendance completed.",
      time: "25 mins ago",
    },
    {
      title: "Payment recorded",
      description: "Juan Dela Cruz paid tuition balance.",
      time: "1 hour ago",
    },
  ];

  return (
    <div data-aos="fade-up" className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Simple overview of your school management system.
          </p>
        </div>

        <div className="rounded-md bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">School Year</p>
          <p className="text-sm font-black text-slate-900">2026 - 2027</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-md bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Students and Attendance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Monthly student growth and attendance trend.
              </p>
            </div>

            <span
              className="rounded-md px-3 py-2 text-xs font-bold"
              style={{
                backgroundColor: brand.softOrange,
                color: brand.darkOrange,
              }}
            >
              Monthly
            </span>
          </div>

          <div className="p-6">
            <GroupedBarChart data={enrollmentData} />

            <div className="mt-5 flex items-center justify-center gap-6">
              <LegendDot color={brand.orange} label="Students" />
              <LegendDot color={brand.cyan} label="Attendance" />
            </div>
          </div>
        </div>

        <div className="rounded-md bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-900">
              Attendance Today
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Current attendance percentage.
            </p>
          </div>

          <div className="flex flex-col items-center p-6">
            <DonutChart percent={89} />

            <div className="mt-6 grid w-full grid-cols-3 gap-3 text-center">
              <SmallStat label="Present" value="285" />
              <SmallStat label="Absent" value="20" />
              <SmallStat label="Late" value="15" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr_1fr]">
        <div className="rounded-md bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-900">
              School Modules
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quick access to core school tools.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <div
                  key={module.title}
                  className="rounded-md bg-slate-50 p-5 transition hover:bg-white hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: module.bg,
                      color: module.color,
                    }}
                  >
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-base font-black text-slate-900">
                    {module.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {module.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-900">
              Students by Grade
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Current division count.
            </p>
          </div>

          <div className="space-y-5 p-6">
            {gradeData.map((item) => (
              <DivisionItem
                key={item.name}
                name={item.name}
                value={item.value}
              />
            ))}
          </div>
        </div>

        <div
          className="overflow-hidden rounded-md shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${brand.orange}, ${brand.cyan})`,
          }}
        >
          <div className="p-6 text-white">
            <p className="text-sm font-semibold text-white/80">
              Total enrolled
            </p>
            <h2 className="mt-2 text-4xl font-black">320</h2>
            <p className="mt-1 text-sm text-white/80">
              Students this school year
            </p>
          </div>

          <div className="px-6 pb-6">
            <BrandLineChart />
          </div>
        </div>
      </div>

      <div className="rounded-md bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-black text-slate-900">
            Recent Activities
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest updates from your school system.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.map((activity) => (
            <div
              key={activity.title}
              className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-black text-slate-900">{activity.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {activity.description}
                </p>
              </div>

              <span className="text-xs font-bold text-slate-400">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ card }) => {
  const Icon = card.icon;

  return (
    <div className="rounded-md bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-600">{card.label}</p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            {card.value}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-400">
            {card.description}
          </p>
        </div>

        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: card.bg,
            color: card.color,
          }}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
};

const GroupedBarChart = ({ data }) => {
  const max = Math.max(
    ...data.flatMap((item) => [item.students, item.attendance]),
  );

  return (
    <div className="flex h-72 items-end gap-5 rounded-md bg-slate-50 px-6 py-5">
      {data.map((item) => {
        const studentsHeight = `${(item.students / max) * 100}%`;
        const attendanceHeight = `${(item.attendance / max) * 100}%`;

        return (
          <div
            key={item.month}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <div className="flex flex-1 items-end justify-center gap-2">
              <div
                className="w-5 rounded-t-md"
                style={{
                  height: studentsHeight,
                  backgroundColor: brand.orange,
                }}
              />

              <div
                className="w-5 rounded-t-md"
                style={{
                  height: attendanceHeight,
                  backgroundColor: brand.cyan,
                }}
              />
            </div>

            <p className="mt-3 text-center text-xs font-bold text-slate-400">
              {item.month}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ percent }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="14"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={brand.orange}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black text-slate-900">{percent}%</p>
        <p className="text-xs font-bold text-slate-400">Present</p>
      </div>
    </div>
  );
};

const BrandLineChart = () => {
  return (
    <svg viewBox="0 0 245 90" className="h-28 w-full">
      <path
        d="M 0 70 C 35 45, 35 45, 70 65 S 105 35, 140 55 S 175 25, 210 50 S 245 30, 245 30"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <circle cx="210" cy="50" r="5" fill="white" />
      <text x="198" y="32" fill="white" fontSize="13" fontWeight="700">
        232
      </text>
    </svg>
  );
};

const LegendDot = ({ color, label }) => {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-semibold text-slate-500">{label}</span>
    </div>
  );
};

const SmallStat = ({ label, value }) => {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-lg font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
};

const DivisionItem = ({ name, value }) => {
  const width = `${(value / 100) * 100}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600">{name}</p>
        <p className="text-sm font-black text-slate-900">{value}</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-md bg-slate-100">
        <div
          className="h-full rounded-md"
          style={{
            width,
            backgroundColor: brand.cyan,
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
