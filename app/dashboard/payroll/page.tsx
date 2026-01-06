"use client";

import React from "react";
import Link from "next/link";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
  FiDownload,
} from "react-icons/fi";

/* ===== SIDEBAR ITEM ===== */
function MenuItem({
  icon,
  label,
  href,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
        ${active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"}`}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}

export default function PayrollPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EDE7F6] to-[#DCCBFA] flex items-center justify-center p-6">

      {/* ===== GLASS CONTAINER ===== */}
      <div className="w-[1250px] h-[700px] bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl flex overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <aside className="w-[260px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-2 text-sm">
            <MenuItem icon={<FiGrid />} label="Dashboard" href="/dashboard" />
            <MenuItem icon={<FiUsers />} label="Recruitment" href="/dashboard/recruitment" />
            <MenuItem icon={<FiUserPlus />} label="Onboarding" href="/dashboard/onboarding" />
            <MenuItem
              icon={<FiCalendar />}
              label="Attendance & Leave"
              href="/dashboard/attendance"
            />
            <MenuItem
              icon={<FiDollarSign />}
              label="Payroll"
              href="/dashboard/payroll"
              active
            />
            <MenuItem icon={<FiHelpCircle />} label="HR Tickets" href="/dashboard/hr-tickets" />
            <MenuItem
              icon={<FiLogOut />}
              label="Exit Management"
              href="/dashboard/exit-management"
            />
          </nav>

          {/* ===== USER CARD ===== */}
          <div className="m-4 p-3 rounded-xl bg-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/30" />
            <div className="text-xs">
              <p className="font-medium">Rahul Dewy</p>
              <p className="opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* ===== RIGHT SIDE ===== */}
        <main className="flex-1 p-8 bg-gradient-to-br from-[#EEE6FB] to-[#EADAF7] overflow-y-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-gray-700">Payroll</h1>

            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm">
              <img src="/avatar.png" className="w-9 h-9 rounded-full" />
              <div>
                <p className="text-sm font-medium">Rahul Dewy</p>
                <p className="text-xs text-gray-400">HR Manager</p>
              </div>
            </div>
          </div>

          {/* ===== SALARY SUMMARY ===== */}
          <section className="bg-white/80 rounded-2xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-600">
                Salary Summary
              </h2>
              <button className="px-5 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-[#7F3FBF] to-[#6F63D9] shadow">
                View Payslip
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <input
                placeholder="Month Selector"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
              />
              <button className="p-2 rounded-lg bg-gray-100">
                <FiDownload />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 bg-[#F2ECFB] text-sm text-gray-600 px-4 py-2">
                <div>Month/Year</div>
                <div>Gross Pay</div>
                <div>Deductions</div>
                <div>Joining Date</div>
                <div>Net Pay</div>
              </div>

              {[
                ["Apr 2024", "—", "—", "25 Apr, 2024", "25 Apr, 2024"],
                ["Apr 2024", "—", "—", "26 Apr, 2024", "17 Apr, 2024"],
              ].map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 px-4 py-3 text-sm text-gray-700 bg-white"
                >
                  {row.map((cell, j) => (
                    <div key={j}>{cell}</div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ===== RECENT PAYSLIPS ===== */}
          <section className="bg-white/80 rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-600">
                Recent Payslips
              </h2>
              <input
                placeholder="Search"
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
              />
            </div>

            <div className="rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 bg-[#F2ECFB] text-sm text-gray-600 px-4 py-2">
                <div>Name</div>
                <div>Skills</div>
                <div>Joining Date</div>
                <div>Status</div>
              </div>

              {[
                ["Emma Davis", "UI/UX Designer", "25 Apr, 2024", "Shortlisted"],
                ["James Wilson", "Sales Executive", "20 Apr, 2024", "Shortlisted"],
                ["John Smith", "Software Engineer", "17 Apr, 2024", "Rejected"],
                ["Jessica Brown", "Digital Marketer · SQL", "17 Apr, 2024", "Rejected"],
              ].map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 px-4 py-3 text-sm bg-white items-center"
                >
                  <div>{row[0]}</div>
                  <div>{row[1]}</div>
                  <div>{row[2]}</div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        row[3] === "Shortlisted"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {row[3]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
