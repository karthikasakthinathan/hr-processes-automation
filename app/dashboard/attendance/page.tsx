"use client";

import Link from "next/link";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
  FiUpload,
} from "react-icons/fi";

/* ================= PAGE ================= */

export default function AttendanceLeavePage() {
  return (
    <div className="min-h-screen bg-[#f4f1fb] flex items-start justify-center p-6">
      <div className="relative w-[1250px] min-h-[650px] rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl flex overflow-hidden">

        {/* ================= SIDEBAR ================= */}
        <aside className="w-[250px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-2 text-[13px]">

            <Link href="/dashboard">
              <MenuItem icon={<FiGrid />} label="Dashboard" />
            </Link>

            <Link href="/dashboard/recruitment">
              <MenuItem icon={<FiUsers />} label="Recruitment" />
            </Link>

            <Link href="/dashboard/onboarding">
              <MenuItem icon={<FiUserPlus />} label="Onboarding" />
            </Link>

            <Link href="/dashboard/attendance">
              <MenuItem
                icon={<FiCalendar />}
                label="Attendance & Leave"
                active
              />
            </Link>

            <Link href="/dashboard/payroll">
              <MenuItem icon={<FiDollarSign />} label="Payroll" />
            </Link>

            <Link href="/dashboard/hr-tickets">
              <MenuItem icon={<FiHelpCircle />} label="HR Tickets" />
            </Link>

            <Link href="/dashboard/exit-management">
              <MenuItem icon={<FiLogOut />} label="Exit Management" />
            </Link>

          </nav>

          <div className="px-5 py-4 flex items-center gap-3 bg-white/10">
            <div className="w-9 h-9 rounded-full bg-white/30" />
            <div className="text-xs">
              <p className="font-medium">Rahul Dewy</p>
              <p className="opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="flex-1 px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Attendance & Leave Module
              </h1>
              <p className="text-xs text-gray-500">
                Here are your key metrics for today
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow">
              <div className="w-7 h-7 rounded-full bg-gray-300" />
              <div className="text-xs">
                <p className="font-medium">Rahul Dewy</p>
                <p className="text-gray-500">HR Manager</p>
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <WaveStatCard title="Total Employees" value="552" />
            <WaveStatCard title="Today's Attendance" value="6" purple />
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl mt-8 shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3">Attendance</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <Row name="Emma Davis" date="25 Apr, 2024" status="Present" />
                <Row name="James Wilson" date="26 Apr, 2024" status="Present" />
                <Row name="Joma Davis" date="25 Apr, 2024" status="Absent" />
                <Row name="Emma Davis" date="25 Apr, 2024" status="Present" />
                <Row name="John Smith" date="23 Apr, 2024" status="Absent" />
              </tbody>
            </table>
          </div>
        </main>

        {/* ================= RIGHT PANEL ================= */}
        <aside className="w-[300px] px-6 py-8 space-y-6 bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] self-start">

          <Card title="Leave Apply Form">
            <Input label="Start Date" />
            <Input label="End Date" />
            <Input label="Reason" />

            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <FiUpload /> Upload File
            </label>

            <button className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm mt-2">
              Submit
            </button>
          </Card>

          <Card title="Leave Status List">
            <Status name="Emma Davis" status="Approved" />
            <Status name="John Smith" status="Rejected" />
            <Status name="James Wilson" status="Open" />
          </Card>

          <Card title="Leave Balance">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Used 5</span>
              <span>Remaining 15</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-full w-[25%] bg-green-500 rounded" />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

const MenuItem = ({ icon, label, active = false }: any) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
    ${active ? "bg-white/20" : "hover:bg-white/10"}`}
  >
    {icon}
    <span>{label}</span>
  </div>
);

const Row = ({ name, date, status }: any) => (
  <tr className="border-b last:border-0 text-gray-700">
    <td className="px-5 py-4">{name}</td>
    <td className="text-center">{date}</td>
    <td className="text-center">
      <span
        className={`px-3 py-1 rounded-full text-[11px]
        ${
          status === "Present"
            ? "bg-green-100 text-green-600"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {status}
      </span>
    </td>
  </tr>
);

const Card = ({ title, children }: any) => (
  <div className="bg-white rounded-xl p-5 shadow">
    <h3 className="text-sm font-semibold mb-4">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const Input = ({ label }: any) => (
  <input
    placeholder={label}
    className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none"
  />
);

const Status = ({ name, status }: any) => (
  <div className="flex justify-between text-xs">
    <span>{name}</span>
    <span
      className={`font-medium ${
        status === "Approved"
          ? "text-green-600"
          : status === "Rejected"
          ? "text-red-500"
          : "text-orange-500"
      }`}
    >
      {status}
    </span>
  </div>
);

/* ================= WAVE CARD ================= */

const WaveStatCard = ({
  title,
  value,
  purple = false,
}: {
  title: string;
  value: string;
  purple?: boolean;
}) => {
  return (
    <div
      className={`relative w-full h-[180px] rounded-2xl overflow-hidden shadow-xl
      ${
        purple
          ? "bg-gradient-to-br from-[#EEE9FF] via-[#F6F2FF] to-white"
          : "bg-gradient-to-br from-[#E6F6FF] via-[#F7FCFF] to-white"
      }`}
    >
      <div className="relative z-10 px-7 pt-6">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <h2
          className={`mt-4 text-[56px] leading-none font-semibold ${
            purple ? "text-[#7B6CFF]" : "text-[#5FA6B5]"
          }`}
        >
          {value}
        </h2>
      </div>

      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 500 120">
        <path
          d="M0,70 C80,95 160,45 250,60 340,75 420,45 500,55 L500,120 L0,120 Z"
          fill={
            purple
              ? "rgba(200,190,255,0.45)"
              : "rgba(180,225,245,0.55)"
          }
        />
      </svg>

      <svg
        className="absolute bottom-0 left-0 w-full opacity-70"
        viewBox="0 0 500 120"
      >
        <path
          d="M0,90 C120,55 220,105 320,80 420,60 470,70 500,65 L500,120 L0,120 Z"
          fill={
            purple
              ? "rgba(200,190,255,0.25)"
              : "rgba(180,225,245,0.25)"
          }
        />
      </svg>
    </div>
  );
};
