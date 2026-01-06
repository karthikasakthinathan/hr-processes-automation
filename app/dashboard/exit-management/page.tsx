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

/* ===== SIDEBAR ITEM ===== */
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
        className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] cursor-pointer
        ${
          active
            ? "bg-white/25 text-white"
            : "text-white/80 hover:bg-white/10"
        }`}
      >
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  );
}

/* ===== PAGE ===== */
export default function ExitManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f1fb] to-[#e9e3f7] flex items-center justify-center p-6">
      <div className="w-[1250px] h-[680px] bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 flex overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <aside className="w-[250px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-2">
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
              active
            />
          </nav>

          <div className="px-4 py-4 text-sm text-white/70">
            Rahul Dewy <br />
            <span className="text-xs">HR Manager</span>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 p-8 overflow-y-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              Exit Management
            </h1>

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow">
              <div className="w-9 h-9 rounded-full bg-gray-200" />
              <div className="text-sm">
                <p className="font-medium text-gray-800">Rahul Dewy</p>
                <p className="text-xs text-gray-500">HR Manager</p>
              </div>
            </div>
          </div>

          {/* RESIGNATION FORM */}
          <div className="bg-white rounded-2xl p-6 shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Resignation Apply Form
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <select className="input">
                <option>Career Growth</option>
                <option>Personal Reasons</option>
                <option>Further Studies</option>
              </select>

              <div className="bg-[#f4f1fb] rounded-xl p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">Reason Options</p>
                <p>• Career Growth</p>
                <p>• Personal Reasons</p>
                <p>• Further Studies</p>
              </div>

              <input
                placeholder="Detailed Reason (Optional)"
                className="input"
              />

              <input
                type="date"
                className="input"
              />
            </div>

            <button className="mt-5 px-6 py-2 rounded-xl bg-gradient-to-r from-[#7F3FBF] to-[#9B6BD6] text-white text-sm shadow">
              Submit Resignation
            </button>
          </div>

          {/* NOTICE + TRACKER */}
          <div className="grid grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="font-semibold text-gray-700 mb-2">
                Your Notice Period
              </h3>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                Period: 60 Days
              </p>
              <p className="text-sm text-gray-500">
                Start Date: 15 May, 2024
              </p>
              <p className="text-sm text-gray-500">
                End Date: 14 July, 2024
              </p>

              <div className="mt-4 h-2 bg-gray-200 rounded-full">
                <div className="h-2 w-[65%] bg-gradient-to-r from-[#7F3FBF] to-[#9B6BD6] rounded-full" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="font-semibold text-gray-700 mb-4">
                Exit Status Tracker
              </h3>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  Resignation Submitted
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                  Manager Approval
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                  Final Settlement
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Current Status: HR Formalities in Progress
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* INPUT STYLE */}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          background: #f4f1fb;
          font-size: 13px;
          outline: none;
        }
      `}</style>
    </div>
  );
}
