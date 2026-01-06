"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";

/* ===== MENU ITEM COMPONENT ===== */
function MenuItem({
  icon,
  label,
  href,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
          ${
            active
              ? "bg-white/20 text-white"
              : "text-white/80 hover:bg-white/10"
          }`}
      >
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#f4f1fb] flex items-center justify-center p-6">
      <div className="w-[1200px] h-[650px] rounded-2xl overflow-hidden shadow-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex">

        {/* ===== SIDEBAR ===== */}
        <aside className="w-[250px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-2 text-[13px]">
            <MenuItem
              icon={<FiGrid />}
              label="Dashboard"
              href="/dashboard"
            />
            <MenuItem
              icon={<FiUsers />}
              label="Recruitment"
              href="/dashboard/recruitment"
            />
            <MenuItem
              icon={<FiUserPlus />}
              label="Onboarding"
              href="/dashboard/onboarding"
              active
            />
            <MenuItem
              icon={<FiCalendar />}
              label="Attendance & Leave"
              href="/dashboard/attendance"
            />
            <MenuItem
              icon={<FiDollarSign />}
              label="Payroll"
              href="/dashboard/payroll"
            />
            <MenuItem
              icon={<FiHelpCircle />}
              label="HR Tickets"
              href="/dashboard/hr-tickets"
            />
            <MenuItem
              icon={<FiLogOut />}
              label="Exit Management"
              href="/dashboard/exit-management"
            />
          </nav>

          <div className="px-5 py-4 flex items-center gap-3 bg-white/10 mt-4">
            <div className="w-9 h-9 rounded-full bg-white/30" />
            <div className="text-xs">
              <p className="font-medium">Rahul Dewy</p>
              <p className="opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA]">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-700">
              Onboarding
            </h1>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow">
              <div className="w-8 h-8 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-600">Rahul Dewy</span>
            </div>
          </div>

          {/* FORM CARD */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Employee Name" placeholder="Enter employee name" />
              <Input label="Job Title" placeholder="Enter job title" />
              <Input label="Email Address" placeholder="Enter email" />
              <Input label="Location" placeholder="Enter location" />
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-600">
                Document Upload
              </label>
              <div className="flex items-center gap-4 mt-2">
                <button className="px-4 py-2 bg-[#6f63d9] text-white rounded-lg text-sm">
                  Upload File
                </button>
                <span className="text-sm text-gray-400">
                  No file selected
                </span>
                <button className="ml-auto px-6 py-2 bg-[#6f63d9] text-white rounded-lg text-sm">
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-medium text-gray-700">
                New Hires List
              </h2>
              <input
                placeholder="Search"
                className="border rounded-lg px-3 py-1.5 text-sm outline-none"
              />
            </div>

            <table className="w-full text-sm">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Joining Date</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {[
                  ["Emma Davis", "UI/UX Designer", "25 Apr, 2024", "Shortlisted"],
                  ["James Wilson", "Sales Executive", "20 Apr, 2024", "Completed"],
                  ["John Smith", "Software Engineer", "17 Apr, 2024", "Missing Docs"],
                  ["Jessica Brown", "Digital Marketer", "17 Apr, 2024", "Rejected"],
                ].map(([name, role, date, status]) => (
                  <tr key={name} className="border-b last:border-none">
                    <td className="py-3">{name}</td>
                    <td>{role}</td>
                    <td>{date}</td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          status === "Completed"
                            ? "bg-green-100 text-green-600"
                            : status === "Shortlisted"
                            ? "bg-blue-100 text-blue-600"
                            : status === "Rejected"
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===== INPUT COMPONENT ===== */
function Input({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        placeholder={placeholder}
        className="w-full mt-1 px-4 py-2 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#6f63d9]"
      />
    </div>
  );
}
