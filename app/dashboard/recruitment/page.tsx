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

export default function RecruitmentPage() {
  return (
    <div className="min-h-screen bg-[#f4f1fb] flex items-center justify-center p-6">
      <div className="w-[1200px] h-[650px] bg-[#efe7fb] rounded-2xl shadow-xl flex overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <aside className="w-[260px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col rounded-l-2xl">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-1 text-[13px]">
            <MenuItem icon={<FiGrid />} label="Dashboard" href="/dashboard" />
            <MenuItem
              icon={<FiUsers />}
              label="Recruitment"
              href="/dashboard/recruitment"
              active
            />
            <MenuItem
              icon={<FiUserPlus />}
              label="Onboarding"
              href="/dashboard/onboarding"
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

          <div className="px-6 py-4 bg-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/30" />
            <div className="text-xs">
              <p className="font-medium">Rahul Devy</p>
              <p className="opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl p-6">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-800">
                Recruitment
              </h1>

              <div className="flex items-center gap-2">
                <img
                  src="/avatar.png"
                  className="w-8 h-8 rounded-full"
                  alt="user"
                />
                <span className="text-sm text-gray-600">Rahul Devy</span>
              </div>
            </div>

            {/* JOB CREATE FORM */}
            <div className="border border-gray-300 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-semibold mb-4">
                Job Create Form
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  placeholder="Job Title"
                  className="border border-gray-400 rounded-md px-4 py-2 text-sm"
                />
                <input
                  placeholder="Location"
                  className="border border-gray-400 rounded-md px-4 py-2 text-sm"
                />
              </div>

              <textarea
                placeholder="Job Description"
                className="w-full border border-gray-400 rounded-md px-4 py-2 text-sm h-28 mb-4"
              />

              <div className="flex items-center justify-between">
                <button className="text-sm text-purple-600 font-medium">
                  Resume Upload
                </button>

                <button className="bg-purple-600 text-white px-6 py-2 rounded-md text-sm">
                  Submit
                </button>
              </div>
            </div>

            {/* CANDIDATE LIST */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">
                  Candidate List
                </h2>

                <input
                  placeholder="Search"
                  className="border border-gray-400 rounded-md px-3 py-1 text-sm"
                />
              </div>

              <table className="w-full text-sm">
                <thead className="text-gray-600 border-b">
                  <tr>
                    <th className="py-2 text-left">Name</th>
                    <th className="text-left">Skills</th>
                    <th className="text-left">Joining Date</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Emma Davis</td>
                    <td>UI/UX Designer</td>
                    <td>25 Apr, 2024</td>
                    <td>
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
                        Shortlisted
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b">
                    <td className="py-2">James Wilson</td>
                    <td>Sales Executive</td>
                    <td>20 Apr, 2024</td>
                    <td>
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">
                        Shortlisted
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2">John Smith</td>
                    <td>Software Engineer</td>
                    <td>17 Apr, 2024</td>
                    <td>
                      <span className="bg-red-100 text-red-500 px-3 py-1 rounded-full text-xs">
                        Rejected
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

/* ===== MENU ITEM ===== */
type MenuItemProps = {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
};

function MenuItem({ icon, label, href, active = false }: MenuItemProps) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition
        ${active ? "bg-white/25" : "hover:bg-white/10"}`}
      >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  );
}
