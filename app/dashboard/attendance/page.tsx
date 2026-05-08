"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiGrid, FiUsers, FiUserPlus, FiCalendar,
  FiDollarSign, FiHelpCircle, FiLogOut, FiAlertTriangle,
  FiCheckCircle, FiClock, FiActivity, FiXCircle,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  employee_id: string;
  date: string;
  status: string;
  check_in: string;
}

interface LeaveRecord {
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  total_leaves: number;
  taking_leave_days: number;
}

interface LeaveBalance {
  total_leaves: number;
  already_taken: number;
  remaining: number;
}

interface PatternSummary {
  total_employees_scanned: number;
  flagged_count: number;
  high_risk: number;
  medium_risk: number;
}

interface FlaggedEmployee {
  employee_id: string;
  risk_level: "high" | "medium" | "low";
  issues: string[];
  details: {
    max_late_streak: number;
    sick_days_last_30: number;
    absent_pct: number;
  };
  ai_recommendation: string;
}

interface PatternData {
  analysis_period: string;
  summary: PatternSummary;
  flagged_employees: FlaggedEmployee[];
}

interface LeaveResult {
  decision: string;
  status: string;
  explanation: string;
  // FIX #3: backend now always sends rejection_reason as a string
  rejection_reason?: string;
  leave_balance?: { total_leaves: number; already_taken: number; remaining: number; requested: number };
  capacity?: { min_capacity_ratio: number; threshold: number; sufficient: boolean };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendanceLeavePage() {
  const [attendance, setAttendance]       = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves]               = useState<LeaveRecord[]>([]);
  const [leaveBalance, setLeaveBalance]   = useState<LeaveBalance | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");
  const [reason, setReason]         = useState("");

  const [leaveResult, setLeaveResult]         = useState<LeaveResult | null>(null);
  const [patterns, setPatterns]               = useState<PatternData | null>(null);
  const [loadingLeave, setLoadingLeave]       = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (employeeId.trim()) fetchLeaveBalance(employeeId.trim());
    else setLeaveBalance(null);
  }, [employeeId]);

  const fetchAttendance = () => {
    fetch("http://localhost:8000/attendance/records", {
      headers: { Authorization: "Bearer " + token() },
    })
      .then((r) => r.json())
      .then((d) => setAttendance(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setAttendance([]));
  };

  const fetchLeaves = () => {
    fetch("http://localhost:8000/attendance/leave-status", {
      headers: { Authorization: "Bearer " + token() },
    })
      .then((r) => r.json())
      .then((d) => setLeaves(d?.data || []))
      .catch(() => setLeaves([]));
  };

  const fetchLeaveBalance = (empId: string) => {
    fetch(`http://localhost:8000/attendance/leave-balance/${empId}`, {
      headers: { Authorization: "Bearer " + token() },
    })
      .then((r) => r.json())
      .then((d) => setLeaveBalance(d))
      .catch(() => setLeaveBalance(null));
  };

  // ── Apply Leave ─────────────────────────────────────────────────────────
  const applyLeave = async () => {
    if (!employeeId || !startDate || !endDate || !reason) {
      alert("Please fill all fields");
      return;
    }
    setLoadingLeave(true);
    setLeaveResult(null);
    try {
      const res = await fetch("http://localhost:8000/attendance/apply-leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token(),
        },
        body: JSON.stringify({
          employee_id: employeeId,
          start_date: startDate,
          end_date: endDate,
          reason,
        }),
      });
      const data = await res.json();
      setLeaveResult(data);
      setStartDate(""); setEndDate(""); setReason("");
      fetchLeaves();
      fetchLeaveBalance(employeeId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeave(false);
    }
  };

  // ── AI Pattern Scan ─────────────────────────────────────────────────────
  const fetchPatterns = async () => {
    setLoadingPatterns(true);
    setPatterns(null);
    try {
      const res = await fetch("http://localhost:8000/attendance/ai-patterns", {
        headers: { Authorization: "Bearer " + token() },
      });
      const data = await res.json();
      setPatterns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPatterns(false);
    }
  };

  // ── Derived Stats ────────────────────────────────────────────────────────
  const totalEmployees = new Set(attendance.map((a) => a.employee_id)).size;
  const mostRecentDate = attendance.length > 0
    ? attendance.reduce((latest, a) => a.date > latest ? a.date : latest, "")
    : "";
  const todayPresent = attendance.filter(
    (a) => a.date === mostRecentDate && a.status === "Present"
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f1fb] flex items-center justify-center p-6 font-sans">
      <div className="relative w-[1250px] min-h-[750px] rounded-[32px] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-2xl flex overflow-hidden">

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <aside className="w-[260px] bg-gradient-to-b from-[#7F3FBF] to-[#6F63D9] text-white flex flex-col">
          <div className="px-8 py-10 text-xl font-bold tracking-tight">Dashboard</div>
          <nav className="flex-1 px-4 space-y-1 text-[14px]">
            <Link href="/dashboard"><MenuItem icon={<FiGrid />} label="Dashboard" /></Link>
            <Link href="/dashboard/recruitment"><MenuItem icon={<FiUsers />} label="Recruitment" /></Link>
            <Link href="/dashboard/onboarding"><MenuItem icon={<FiUserPlus />} label="Onboarding" /></Link>
            <Link href="/dashboard/attendance"><MenuItem icon={<FiCalendar />} label="Attendance & Leave" active /></Link>
            <Link href="/dashboard/payroll"><MenuItem icon={<FiDollarSign />} label="Payroll" /></Link>
            <Link href="/dashboard/hr-tickets"><MenuItem icon={<FiHelpCircle />} label="HR Tickets" /></Link>
            <Link href="/dashboard/exit-management"><MenuItem icon={<FiLogOut />} label="Exit Management" /></Link>
          </nav>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <main className="flex-1 px-10 py-10 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Attendance & Leave Module
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time metrics · AI-powered approvals & burnout detection
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-8 mt-6">
            <WaveStatCard title="Total Employees" value={totalEmployees.toString()} />
            <WaveStatCard title="Today's Attendance" value={todayPresent.toString()} purple />
          </div>

          {/* ── AI PATTERN RECOGNITION ─────────────────────────────── */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-700 tracking-wide flex items-center gap-2">
                  <FiActivity className="text-purple-500" />
                  AI Burnout & Pattern Detection
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scans last 30 days for late arrivals, sick-leave spikes & absenteeism
                </p>
              </div>
              <button
                onClick={fetchPatterns}
                disabled={loadingPatterns}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#7F3FBF] to-[#9B6BD6] text-white text-xs font-bold shadow hover:brightness-110 transition disabled:opacity-50"
              >
                {loadingPatterns ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <><FiActivity /> Run AI Scan</>
                )}
              </button>
            </div>

            {patterns && (
              <div className="bg-white/90 rounded-2xl border border-purple-100 shadow-sm p-5 mb-6">
                {/* Summary Row */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Scanned",     val: patterns.summary?.total_employees_scanned, color: "text-slate-700" },
                    { label: "Flagged",     val: patterns.summary?.flagged_count,            color: "text-orange-500" },
                    { label: "High Risk",   val: patterns.summary?.high_risk,                color: "text-red-500" },
                    { label: "Medium Risk", val: patterns.summary?.medium_risk,              color: "text-yellow-500" },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#f8f5ff] rounded-xl p-3 text-center">
                      <p className={`text-2xl font-black ${s.color}`}>{s.val ?? 0}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Analysis Period */}
                <p className="text-[10px] text-slate-400 mb-3">
                  Analysis period: {patterns.analysis_period}
                </p>

                {/* Flagged Employees */}
                {patterns.flagged_employees?.length > 0 ? (
                  <div className="space-y-3">
                    {patterns.flagged_employees.map((emp, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-4 border ${
                          emp.risk_level === "high"
                            ? "bg-red-50 border-red-200"
                            : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FiAlertTriangle className={emp.risk_level === "high" ? "text-red-500" : "text-yellow-500"} />
                            <span className="font-bold text-slate-700 text-sm">{emp.employee_id}</span>
                          </div>
                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            emp.risk_level === "high"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {emp.risk_level} risk
                          </span>
                        </div>

                        <div className="flex gap-2 mb-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">
                            Late streak: {emp.details.max_late_streak}d
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">
                            Sick days: {emp.details.sick_days_last_30}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">
                            Absent: {emp.details.absent_pct}%
                          </span>
                        </div>

                        <div className="space-y-1 mb-2">
                          {emp.issues.map((issue, j) => (
                            <p key={j} className="text-xs text-slate-600">• {issue}</p>
                          ))}
                        </div>

                        <div className="bg-white/70 rounded-lg p-2.5 mt-2 border border-white">
                          <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">
                            🧠 AI Recommendation
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {emp.ai_recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3 border border-green-200">
                    <FiCheckCircle />
                    <span className="text-sm font-semibold">
                      No anomalies detected. All employees look healthy!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attendance Table */}
          <div className="mt-4">
            <h3 className="font-bold text-slate-700 mb-4 tracking-wide">Recent Logs</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-slate-400 text-[11px] uppercase font-bold tracking-widest bg-[#F2ECFB] text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Employee ID</th>
                    <th className="px-6 py-4 font-semibold text-center">Date</th>
                    <th className="px-6 py-4 font-semibold text-center">Check-In</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendance.length > 0 ? (
                    attendance.map((item, i) => (
                      <AttendanceRow
                        key={i}
                        id={item.employee_id}
                        date={item.date}
                        time={item.check_in || "-"}
                        status={item.status}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm italic">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <aside className="w-[340px] px-7 py-10 space-y-5 bg-gradient-to-br from-[#f8f6ff] to-[#f0eaff] border-l border-white/50 overflow-y-auto">

          {/* Leave Form */}
          <RightCard title="Leave Apply Form">
            <div className="space-y-4">
              <FormInput
                label="Employee ID"
                type="text"
                value={employeeId}
                onChange={(e: any) => setEmployeeId(e.target.value)}
                placeholder="e.g. E001"
              />

              {leaveBalance && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <p className="text-[10px] font-bold text-purple-500 uppercase mb-2">Leave Balance</p>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Used: {leaveBalance.already_taken}</span>
                    <span>Remaining: {leaveBalance.remaining}</span>
                    <span>Total: {leaveBalance.total_leaves}</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden border border-purple-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(leaveBalance.already_taken / leaveBalance.total_leaves) * 100}%`,
                        background: leaveBalance.remaining <= 3
                          ? "#ef4444"
                          : leaveBalance.remaining <= 7
                          ? "#f59e0b"
                          : "#7F3FBF",
                      }}
                    />
                  </div>
                </div>
              )}

              <FormInput
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e: any) => setStartDate(e.target.value)}
              />
              <FormInput
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e: any) => setEndDate(e.target.value)}
              />

              {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
                <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-xs text-slate-500 flex justify-between">
                  <span>Requesting:</span>
                  <span className="font-bold text-slate-700">
                    {Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1} day(s)
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Reason</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Type here..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none min-h-[70px]"
                />
              </div>

              <button
                onClick={applyLeave}
                disabled={loadingLeave}
                className="w-full bg-[#7F3FBF] text-white py-3 rounded-xl text-sm font-semibold shadow-lg hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingLeave ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </RightCard>

          {/* ── AI DECISION RESULT ─────────────────────────────────── */}
          {leaveResult && (
            <RightCard title="🤖 AI Decision">
              <div className={`rounded-xl p-3 border ${
                leaveResult.decision === "auto_approved"
                  ? "bg-green-50 border-green-200"
                  : leaveResult.decision === "auto_rejected"
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {leaveResult.decision === "auto_approved" && (
                    <FiCheckCircle className="text-green-500 text-lg" />
                  )}
                  {leaveResult.decision === "auto_rejected" && (
                    <FiXCircle className="text-red-500 text-lg" />
                  )}
                  {/* FIX #2: was checking "escalated_to_manager" — now "escalate_to_manager" */}
                  {leaveResult.decision === "escalate_to_manager" && (
                    <FiClock className="text-yellow-500 text-lg" />
                  )}
                  <span className={`text-sm font-black uppercase tracking-wide ${
                    leaveResult.decision === "auto_approved"
                      ? "text-green-700"
                      : leaveResult.decision === "auto_rejected"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}>
                    {leaveResult.decision === "auto_approved"
                      ? "Auto Approved ✅"
                      : leaveResult.decision === "auto_rejected"
                      ? "Rejected ❌"
                      : "Sent to Manager 🔄"}
                  </span>
                </div>

                {/* FIX #3: rejection_reason now always a string from backend */}
                {leaveResult.rejection_reason && (
                  <div className="bg-red-100/60 rounded-lg p-2.5 mb-2 border border-red-200">
                    <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Reason for Rejection</p>
                    <p className="text-xs text-red-700 leading-relaxed">{leaveResult.rejection_reason}</p>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {leaveResult.explanation}
                </p>

                {leaveResult.leave_balance && (
                  <div className="bg-white/80 rounded-lg p-2 border border-white mb-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Leave Balance</p>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Used: {leaveResult.leave_balance.already_taken}</span>
                      <span>Remaining: {leaveResult.leave_balance.remaining}</span>
                      <span>Total: {leaveResult.leave_balance.total_leaves}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-purple-400"
                        style={{
                          width: `${(leaveResult.leave_balance.already_taken / leaveResult.leave_balance.total_leaves) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {leaveResult.capacity && (
                  <div className="bg-white/80 rounded-lg p-2 border border-white">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Team Capacity</p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          leaveResult.capacity.sufficient ? "bg-green-400" : "bg-red-400"
                        }`}
                        style={{
                          width: `${(leaveResult.capacity.min_capacity_ratio * 100).toFixed(0)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {(leaveResult.capacity.min_capacity_ratio * 100).toFixed(0)}% available ·{" "}
                      Threshold: {leaveResult.capacity.threshold * 100}%
                    </p>
                  </div>
                )}
              </div>
            </RightCard>
          )}

          {/* Leave Status List */}
          <RightCard title="Leave Status List">
            <div className="space-y-3">
              {leaves.length > 0 ? (
                leaves.map((leave, idx) => (
                  <LeaveStatusItem
                    key={idx}
                    id={leave.employee_id}
                    date={leave.start_date}
                    status={leave.status}
                    days={leave.taking_leave_days}
                    totalLeaves={leave.total_leaves}
                  />
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center py-2">
                  No leave records found
                </p>
              )}
            </div>
          </RightCard>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const MenuItem = ({ icon, label, active = false }: any) => (
  <div className={`flex items-center gap-4 px-5 py-3 rounded-xl cursor-pointer transition-all ${
    active
      ? "bg-white/20 shadow-inner font-semibold"
      : "hover:bg-white/10 opacity-80 hover:opacity-100"
  }`}>
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </div>
);

const AttendanceRow = ({ id, date, time, status }: any) => (
  <tr className="hover:bg-slate-50/50 transition-colors">
    <td className="px-6 py-4 text-sm font-bold text-slate-700">{id}</td>
    <td className="px-6 py-4 text-sm text-slate-500 text-center">{date}</td>
    <td className="px-6 py-4 text-sm text-slate-500 text-center">{time}</td>
    <td className="px-6 py-4 text-center">
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
        status === "Present"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}>
        {status}
      </span>
    </td>
  </tr>
);

const LeaveStatusItem = ({ id, date, status, days, totalLeaves }: any) => {
  const styles: Record<string, string> = {
    Approved: "bg-amber-100 text-amber-700",
    Rejected: "bg-rose-100 text-rose-700",
    Pending:  "bg-blue-100 text-blue-700",
  };
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
          {id?.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700 leading-none mb-1">{id}</p>
          <p className="text-[10px] text-slate-400 font-medium">{date}</p>
          {days != null && (
            <p className="text-[10px] text-purple-400 font-medium">{days} day(s)</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-[8px] text-slate-300 uppercase font-black mb-1">Status</p>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
          styles[status] || "bg-slate-100 text-slate-500"
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
};

const RightCard = ({ title, children }: any) => (
  <div className="bg-white/90 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-white">
    <h3 className="text-[14px] font-bold text-slate-800 mb-4 tracking-tight">{title}</h3>
    {children}
  </div>
);

const FormInput = ({ label, type = "text", value = "", placeholder = "", ...props }: any) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{label}</p>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      {...props}
      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 outline-none transition-all"
    />
  </div>
);

const WaveStatCard = ({ title, value, purple = false }: any) => {
  const primaryColor = purple ? "#7F3FBF" : "#5FA6B5";
  const waveColor    = purple ? "rgba(182,160,255,0.4)" : "rgba(164,218,230,0.5)";
  return (
    <div className={`relative w-full h-[180px] rounded-[32px] overflow-hidden shadow-xl border border-white ${
      purple
        ? "bg-gradient-to-br from-[#F5F1FF] to-[#FFFFFF]"
        : "bg-gradient-to-br from-[#F0F9FF] to-[#FFFFFF]"
    }`}>
      <div className="relative z-20 px-8 pt-8">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</p>
        <h2
          className="mt-3 text-[56px] leading-none font-bold tracking-tighter"
          style={{ color: primaryColor }}
        >
          {value}
        </h2>
      </div>
      <svg
        className="absolute bottom-0 left-0 w-full h-[90px]"
        preserveAspectRatio="none"
        viewBox="0 0 500 150"
      >
        <path
          d="M0,80 C150,150 350,20 500,80 L500,150 L0,150 Z"
          fill={waveColor}
          className="opacity-40"
        />
        <path
          d="M0,100 C100,60 200,140 300,100 C400,60 500,110 500,110 L500,150 L0,150 Z"
          fill={waveColor}
        />
      </svg>
    </div>
  );
};
