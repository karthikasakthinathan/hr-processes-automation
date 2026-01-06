"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiClock,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f4f1fb] flex items-center justify-center p-6">
      <div className="relative w-[1200px] h-[620px] rounded-2xl overflow-hidden shadow-2xl bg-white/30 backdrop-blur-xl border border-white/40 flex">

        {/* SIDEBAR */}
        <aside className="w-[260px] bg-gradient-to-b from-[#4b3fa6] to-[#6f63d9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-2 text-sm">
            <SidebarLink href="/dashboard" icon={<FiGrid />} label="Dashboard" active />
            <SidebarLink href="/dashboard/recruitment" icon={<FiUsers />} label="Recruitment" />
            <SidebarLink href="/dashboard/onboarding" icon={<FiUserPlus />} label="Onboarding" />
            <SidebarLink href="/dashboard/attendance" icon={<FiClock />} label="Attendance & Leave" />
            <SidebarLink href="/dashboard/payroll" icon={<FiDollarSign />} label="Payroll" />
            <SidebarLink href="/dashboard/hr-tickets" icon={<FiHelpCircle />} label="HR Tickets" />
            <SidebarLink href="/dashboard/exit-management" icon={<FiLogOut />} label="Exit Management" />
          </nav>

          {/* PROFILE */}
          <div className="px-6 py-4 border-t border-white/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-xs">
              RD
            </div>
            <div>
              <p className="text-sm font-medium">Rahul Dewy</p>
              <p className="text-xs opacity-70">HR Manager</p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="relative flex-1 overflow-hidden">
          {/* BACKGROUND IMAGE */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/image.png')" }}
          />

          {/* GLASS OVERLAY */}
          <div className="absolute inset-0 bg-white/20" />

          {/* CONTENT */}
          <div className="relative z-10 h-full flex items-center justify-center text-center px-10">
            <h1 className="text-4xl font-semibold text-gray-900 leading-snug">
              Welcome to the HR <br />
              Processes Automation
            </h1>
          </div>
        </main>
      </div>
    </div>
  );
}

/* SIDEBAR LINK COMPONENT */
type SidebarLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
};

function SidebarLink({ href, icon, label, active = false }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer
        ${active ? "bg-white/25" : "hover:bg-white/15"}`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
