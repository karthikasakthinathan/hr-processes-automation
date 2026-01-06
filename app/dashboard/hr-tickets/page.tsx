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
  FiPaperclip,
} from "react-icons/fi";

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
        ${active ? "bg-white/25 text-white" : "text-white/80 hover:bg-white/10"}`}
      >
        <span className="text-lg">{icon}</span>
        <span className="text-[13px]">{label}</span>
      </div>
    </Link>
  );
}

export default function HrTicketsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f1fb] to-[#e7ddfa] flex items-center justify-center p-6">
      <div className="w-[1250px] h-[700px] bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl flex overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <aside className="w-[260px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-1">
            <MenuItem icon={<FiGrid />} label="Dashboard" href="/dashboard" />
            <MenuItem icon={<FiUsers />} label="Recruitment" href="/dashboard/recruitment" />
            <MenuItem icon={<FiUserPlus />} label="Onboarding" href="/dashboard/onboarding" />
            <MenuItem
              icon={<FiCalendar />}
              label="Attendance & Leave"
              href="/dashboard/attendance"
            />
            <MenuItem icon={<FiDollarSign />} label="Payroll" href="/dashboard/payroll" />
            <MenuItem
              icon={<FiHelpCircle />}
              label="HR Tickets"
              href="/dashboard/hr-tickets"
              active
            />
            <MenuItem
              icon={<FiLogOut />}
              label="Exit Management"
              href="/dashboard/exit-management"
            />
          </nav>

          <div className="m-4 p-3 rounded-xl bg-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/30" />
            <div className="text-xs">
              <p className="font-medium">Rahul Dewy</p>
              <p className="opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <main className="flex-1 p-8 bg-gradient-to-br from-[#EEE6FB] to-[#EADAF7] overflow-y-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-gray-700">
              HR Ticketing
            </h1>

            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm">
              <img src="/avatar.png" className="w-9 h-9 rounded-full" />
              <div>
                <p className="text-sm font-medium">Rahul Dewy</p>
                <p className="text-xs text-gray-400">HR Manager</p>
              </div>
            </div>
          </div>

          {/* ===== CREATE TICKET ===== */}
          <section className="bg-white/80 rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              Create Ticket Form
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                placeholder="Subject"
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
              />
              <input
                placeholder="Category (e.g. Leave Request)"
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
              />
            </div>

            <textarea
              placeholder="Description"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none h-28 mb-4"
            />

            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 text-sm text-purple-600">
                <FiPaperclip /> Attachment
              </button>

              <button className="px-6 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-[#7F3FBF] to-[#6F63D9]">
                Submit Ticket
              </button>
            </div>
          </section>

          {/* ===== RECENT TICKETS ===== */}
          <section className="bg-white/80 rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-600">
                Recent Tickets
              </h2>
              <input
                placeholder="Search"
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
              />
            </div>

            <div className="rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 bg-[#F2ECFB] text-sm text-gray-600 px-4 py-2">
                <div>Name</div>
                <div>Subject</div>
                <div>Date</div>
                <div>Status</div>
              </div>

              {[
                ["Emma Davis", "Laptop repair request", "25 Apr, 2024", "Open"],
                ["James Wilson", "Annual leave approval", "24 Apr, 2024", "In Progress"],
                ["John Smith", "Software access", "23 Apr, 2024", "In Progress"],
                ["Jessica Brown", "Health insurance query", "22 Apr, 2024", "Closed"],
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
                        row[3] === "Open"
                          ? "bg-purple-100 text-purple-600"
                          : row[3] === "In Progress"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gray-200 text-gray-600"
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
