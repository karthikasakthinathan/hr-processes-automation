"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";

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
        ${active ? "bg-white/25 text-white" : "text-white/80 hover:bg-white/10"}`}
      >
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  );
}

export default function ExitManagementPage() {
  const [employeeId, setEmployeeId] = useState("")
  const [reason, setReason] = useState("Career Growth")
  const [detail, setDetail] = useState("")
  const [lwd, setLwd] = useState("")
  const [exits, setExits] = useState<any[]>([])

  useEffect(() => {
    fetchExits()
  }, [])

  const fetchExits = () => {
    const token = localStorage.getItem("token")
    axios.get("http://127.0.0.1:8000/exit/all-active", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setExits(res.data.data || [])
    })
  }

  // ✅ FIX: getStage now reads backend-provided stage directly
  // No more frontend guessing — backend sends the correct stage number
  const getStage = (exit: any): number => {
    // If backend sends stage directly, use it
    if (typeof exit.stage === "number") return exit.stage

    // Fallback mapping for safety (covers all known statuses)
    const map: Record<string, number> = {
      "Resignation Submitted": 1,
      "Notice Period":         1,
      "Processing":            1,  // ✅ Excel-uploaded records
      "Manager Approved":      2,
      "HR Approved":           2,  // ✅ added missing
      "Final Settlement":      3,
      "Completed":             3,
    }
    return map[exit.status] ?? 1
  }

  const submitExit = async () => {
    const token = localStorage.getItem("token")
    

    if (!employeeId) {
      alert("Please enter Employee ID")  // ✅ state check
      return
    }

    if (!lwd) {
      alert("Please select last working date")
      return
    }

    await axios.post(
      "http://127.0.0.1:8000/exit/apply",
      {
        employee_id: employeeId,
        reason: reason,
        detailed_reason: detail,
        last_working_date: lwd,
        notice_period_days: 60
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    alert("Exit Applied Successfully!")
    fetchExits()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f1fb] to-[#e9e3f7] flex items-center justify-center p-6">
      <div className="w-[1250px] h-[680px] bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 flex overflow-hidden">

        <aside className="w-[250px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-6 py-6 text-lg font-semibold">Dashboard</div>

          <nav className="flex-1 px-4 space-y-2">
            <MenuItem icon={<FiGrid />} label="Dashboard" href="/dashboard" />
            <MenuItem icon={<FiUsers />} label="Recruitment" href="/dashboard/recruitment" />
            <MenuItem icon={<FiUserPlus />} label="Onboarding" href="/dashboard/onboarding" />
            <MenuItem icon={<FiCalendar />} label="Attendance & Leave" href="/dashboard/attendance" />
            <MenuItem icon={<FiDollarSign />} label="Payroll" href="/dashboard/payroll" />
            <MenuItem icon={<FiHelpCircle />} label="HR Tickets" href="/dashboard/hr-tickets" />
            <MenuItem icon={<FiLogOut />} label="Exit Management" href="/dashboard/exit-management" active />
          </nav>

          <div className="px-4 py-4 text-sm text-white/70">
            Rahul Dewy <br />
            <span className="text-xs">HR Manager</span>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              Exit Management
            </h1>
          </div>

          {/* RESIGNATION FORM */}
          <div className="bg-white rounded-2xl p-6 shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Resignation Apply Form
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Employee ID"
                className="input"
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <select className="input" onChange={(e) => setReason(e.target.value)}>
                
                <option>Career Growth</option>
                <option>Personal Reasons</option>
                <option>Further Studies</option>
              </select>

             

              <input
                placeholder="Detailed Reason (Optional)"
                className="input"
                onChange={(e) => setDetail(e.target.value)}
              />

              <input
                type="date"
                className="input"
                onChange={(e) => setLwd(e.target.value)}
              />
            </div>

            <button
              onClick={submitExit}
              className="mt-5 px-6 py-2 rounded-xl bg-gradient-to-r from-[#7F3FBF] to-[#9B6BD6] text-white text-sm shadow"
            >
              Submit Resignation
            </button>
          </div>

          {/* DYNAMIC EXIT CARDS */}
          <div className="mb-3 text-sm font-semibold text-gray-600">
            Active Exit Requests ({exits.length})
          </div>

          {exits.length === 0 ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl shadow text-center text-gray-400 text-sm">
                No active exit requests
              </div>
            </div>
          ) : (
            exits.map((exit, i) => {
              const stage = getStage(exit)   // ✅ pass full exit object
              return (
                <div key={i} className="grid grid-cols-2 gap-6 mb-4">

                  {/* NOTICE PERIOD CARD */}
                  <div className="bg-white p-5 rounded-2xl shadow">
                    <h2 className="text-lg font-semibold mb-3">Notice Period</h2>

                    <div className="text-sm mb-2 space-y-1">
                      <p><span className="font-semibold">Employee ID:</span> {exit.employee_id}</p>
                      <p><span className="font-semibold">Reason:</span> {exit.reason}</p>
                      {/* ✅ FIX: start_date now shows — was missing before */}
                      <p>
                        <span className="font-semibold">Start Date:</span>{" "}
                        {exit.start_date || <span className="text-gray-400 italic">Not set</span>}
                      </p>
                      <p>
                        <span className="font-semibold">End Date:</span>{" "}
                        {exit.end_date || <span className="text-gray-400 italic">Not set</span>}
                      </p>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${exit.progress}%` }}
                      />
                    </div>

                    <p className="text-xs mt-2 text-gray-500">
                      Progress: {exit.progress}% &nbsp;|&nbsp; Remaining Days: {exit.remaining_days}
                    </p>
                  </div>

                  {/* EXIT STATUS TRACKER */}
                  <div className="bg-white rounded-2xl p-6 shadow">
                    <h3 className="font-semibold text-gray-700 mb-5">
                      Exit Status Tracker
                    </h3>

                    {/* ✅ FIX: Vertical stepper with connector lines for clearer stage display */}
                    <div className="flex flex-col gap-4 text-sm">

                      {/* Step 1 */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                          ${stage >= 1 ? "bg-blue-500" : "bg-gray-300"}`}>
                          {stage > 1 ? "✓" : "1"}
                        </div>
                        <div>
                          <p className={`font-medium ${stage >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                            Resignation Submitted
                          </p>
                          {stage === 1 && (
                            <p className="text-[11px] text-gray-400">Current Stage</p>
                          )}
                        </div>
                      </div>

                      {/* Connector */}
                      <div className={`ml-2 w-0.5 h-4 ${stage >= 2 ? "bg-blue-400" : "bg-gray-200"}`} />

                      {/* Step 2 */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                          ${stage >= 2 ? "bg-blue-500" : "bg-gray-300"}`}>
                          {stage > 2 ? "✓" : "2"}
                        </div>
                        <div>
                          <p className={`font-medium ${stage >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                            Manager Approval
                          </p>
                          {stage === 2 && (
                            <p className="text-[11px] text-gray-400">Current Stage</p>
                          )}
                        </div>
                      </div>

                      {/* Connector */}
                      <div className={`ml-2 w-0.5 h-4 ${stage >= 3 ? "bg-blue-400" : "bg-gray-200"}`} />

                      {/* Step 3 */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                          ${stage >= 3 ? "bg-green-500" : "bg-gray-300"}`}>
                          {stage >= 3 ? "✓" : "3"}
                        </div>
                        <div>
                          <p className={`font-medium ${stage >= 3 ? "text-green-600" : "text-gray-400"}`}>
                            Final Settlement
                          </p>
                          {stage === 3 && (
                            <p className="text-[11px] text-gray-400">Current Stage</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* ✅ FIX: Status badge instead of plain text */}
                    <div className="mt-5 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold
                        ${stage === 3 ? "bg-green-100 text-green-700" :
                          stage === 2 ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"}`}>
                        {exit.status}
                      </span>
                    </div>
                  </div>

                </div>
              )
            })
          )}

        </main>
      </div>

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
