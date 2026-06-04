import { useState, useEffect } from "react";
import CoursesPage from "./CoursesPage";

const API = "/api/sessions";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function formatTime(t) {
  if (!t) return "--";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2,"0")} ${ampm}`;
}
function duration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return null;
  return mins;
}
function getNow() {
  const now = new Date();
  const date = now.toISOString().slice(0,10);
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  return { date, time: `${hh}:${mm}` };
}
function getWeekRange(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (dt) => dt.toISOString().slice(0,10);
  return { start: fmt(mon), end: fmt(sun) };
}
function formatDateShort(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function belgiumToPakistan(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const pkH = (h + 3) % 24;
  return `${String(pkH).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
function pakistanToBelgium(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  let belH = h - 3; if (belH < 0) belH += 24;
  return `${String(belH).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { date: todayDate, time: nowTime } = getNow();
  const [form, setForm] = useState({ date: todayDate, start: nowTime, end: "", notes: "" });
  const [rate, setRate] = useState(() => localStorage.getItem("class_rate") || "");
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});
  const [saving, setSaving] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleWeek, setScheduleWeek] = useState(() => getWeekRange(todayDate).start);
  const [scheduleData, setScheduleData] = useState({});
  const [scheduleDays, setScheduleDays] = useState([]);
  const [belgiumTime, setBelgiumTime] = useState("11:00");
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [editingScheduleWeek, setEditingScheduleWeek] = useState(null);
  const [deleteScheduleWeek, setDeleteScheduleWeek] = useState(null);

  const [completedDays, setCompletedDays] = useState(() => {
    const stored = localStorage.getItem("completed_days");
    return stored ? JSON.parse(stored) : {};
  });

  const [showUnpaidPanel, setShowUnpaidPanel] = useState(false);
  const [showCourses, setShowCourses] = useState(false);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => { localStorage.setItem("class_rate", rate); }, [rate]);
  useEffect(() => {
    const stored = localStorage.getItem("class_schedules");
    if (stored) setScheduleData(JSON.parse(stored));
  }, []);
  useEffect(() => {
    if (editingScheduleWeek) {
      const wd = scheduleData[editingScheduleWeek];
      if (wd) { setScheduleDays(wd.days || []); setBelgiumTime(wd.belgiumTime || "11:00"); }
      else { setScheduleDays([]); setBelgiumTime("11:00"); }
    } else {
      const wd = scheduleData[scheduleWeek];
      if (wd) { setScheduleDays(wd.days || []); setBelgiumTime(wd.belgiumTime || "11:00"); }
      else { setScheduleDays([]); setBelgiumTime("11:00"); }
    }
  }, [scheduleWeek, scheduleData, editingScheduleWeek]);

  const saveCompletedDays = (newData) => {
    setCompletedDays(newData);
    localStorage.setItem("completed_days", JSON.stringify(newData));
  };

  const toggleDayCompleted = async (weekStart, day, scheduleInfo) => {
    const key = `${weekStart}__${day}`;
    const alreadyDone = !!completedDays[key];
    if (!alreadyDone) {
      const dayIdx = DAYS.indexOf(day);
      const weekStartDate = new Date(weekStart + "T12:00:00");
      weekStartDate.setDate(weekStartDate.getDate() + dayIdx);
      const classDate = weekStartDate.toISOString().slice(0, 10);
      const classStart = scheduleInfo?.belgiumTime ? belgiumToPakistan(scheduleInfo.belgiumTime) : "";
      const body = { date: classDate, start: classStart, end: "", duration: null, notes: `Schedule class — ${DAYS_FULL[dayIdx]}`, paid: false };
      try {
        const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const saved = await res.json();
        setSessions(prev => [saved, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
        saveCompletedDays({ ...completedDays, [key]: saved._id });
      } catch (e) { console.error(e); }
    } else {
      const sessionId = completedDays[key];
      if (sessionId && typeof sessionId === "string") {
        try { await fetch(`${API}/${sessionId}`, { method: "DELETE" }); setSessions(prev => prev.filter(s => s._id !== sessionId)); } catch (e) {}
      }
      const newData = { ...completedDays };
      delete newData[key];
      saveCompletedDays(newData);
    }
  };

  const isDayCompleted = (weekStart, day) => !!completedDays[`${weekStart}__${day}`];

  const saveSchedule = (weekKey) => {
    setScheduleSaving(true);
    const newData = { ...scheduleData, [weekKey]: { days: scheduleDays, belgiumTime, savedAt: new Date().toISOString() } };
    setScheduleData(newData);
    localStorage.setItem("class_schedules", JSON.stringify(newData));
    setTimeout(() => { setScheduleSaving(false); setEditingScheduleWeek(null); if (!editingScheduleWeek) setShowSchedule(false); }, 700);
  };

  const deleteSchedule = (weekKey) => {
    const newData = { ...scheduleData };
    delete newData[weekKey];
    setScheduleData(newData);
    localStorage.setItem("class_schedules", JSON.stringify(newData));
    const newCompleted = { ...completedDays };
    Object.keys(newCompleted).forEach(k => { if (k.startsWith(weekKey + "__")) delete newCompleted[k]; });
    saveCompletedDays(newCompleted);
    setDeleteScheduleWeek(null);
  };

  const toggleScheduleDay = (day) => setScheduleDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  const changeWeek = (dir) => {
    const d = new Date(scheduleWeek + "T12:00:00");
    d.setDate(d.getDate() + dir * 7);
    setScheduleWeek(d.toISOString().slice(0,10));
  };

  const openForm = () => {
    const { date, time } = getNow();
    setForm({ date, start: time, end: "", notes: "" });
    setShowForm(true);
  };
  const addSession = async () => {
    if (!form.date) return;
    setSaving(true);
    const dur = duration(form.start, form.end);
    const body = { date: form.date, start: form.start, end: form.end, duration: dur, notes: form.notes.trim(), paid: false };
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    setSessions(prev => [saved, ...prev].sort((a,b) => b.date.localeCompare(a.date)));
    setShowForm(false); setSaving(false);
  };
  const deleteSession = async (id) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s._id !== id));
    setDeleteId(null);
  };
  const saveNotes = async (id) => {
    const newNote = editingNotes[id] ?? sessions.find(s => s._id === id)?.notes ?? "";
    await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: newNote }) });
    setSessions(prev => prev.map(s => s._id === id ? { ...s, notes: newNote } : s));
    setExpandedId(null);
  };
  const togglePaid = async (id, currentPaid) => {
    const newPaid = !currentPaid;
    await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: newPaid }) });
    setSessions(prev => prev.map(s => s._id === id ? { ...s, paid: newPaid } : s));
  };
  const markAllPaid = async () => {
    const unpaid = filtered.filter(s => !s.paid);
    if (!unpaid.length) return;
    await Promise.all(unpaid.map(s => fetch(`${API}/${s._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: true }) })));
    setSessions(prev => prev.map(s => filtered.find(f => f._id === s._id) ? { ...s, paid: true } : s));
  };

  const allMonths = [...new Set([...sessions.map(s => s.date.slice(0,7)), activeMonth])].sort().reverse();
  const filtered = sessions.filter(s => s.date.startsWith(activeMonth));
  const paidCount = filtered.filter(s => s.paid).length;
  const unpaidCount = filtered.length - paidCount;
  const rateNum = parseFloat(rate) || 0;
  const paidAmount = rateNum ? (paidCount * rateNum).toFixed(2) : null;
  const unpaidAmount = rateNum ? (unpaidCount * rateNum).toFixed(2) : null;
  const [yr, mo] = activeMonth.split("-").map(Number);
  const monthLabel = `${MONTHS_FULL[mo-1]} ${yr}`;
  const pkTime = belgiumToPakistan(belgiumTime);

  const globalUnpaidByMonth = allMonths.map(m => {
    const monthSessions = sessions.filter(s => s.date.startsWith(m));
    const unpaid = monthSessions.filter(s => !s.paid).length;
    const amount = rateNum ? unpaid * rateNum : null;
    const [y2, m2] = m.split("-").map(Number);
    return { key: m, label: `${MONTHS_FULL[m2-1]} ${y2}`, unpaid, amount };
  }).filter(m => m.unpaid > 0);
  const globalTotalUnpaid = globalUnpaidByMonth.reduce((sum, m) => sum + m.unpaid, 0);
  const globalTotalAmount = rateNum ? globalUnpaidByMonth.reduce((sum, m) => sum + m.amount, 0) : null;

  const thisWeekKey = getWeekRange(todayDate).start;
  const thisWeekSchedule = scheduleData[thisWeekKey];
  const weekRange = getWeekRange(editingScheduleWeek || scheduleWeek);
  const savedScheduleWeeks = Object.keys(scheduleData).sort().reverse();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1923 0%, #1a2940 50%, #0f2318 100%)",
      fontFamily: "'Georgia', serif",
      color: "#e8d5b0", position: "relative", overflowX: "hidden",
    }}>

      {/* COURSES PAGE */}
      {showCourses && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, overflowY: "auto" }}>
          <div style={{
            position: "sticky", top: 0, zIndex: 101,
            display: "flex", justifyContent: "flex-end",
            padding: "12px 16px",
            background: "rgba(212,175,55,0.08)",
            borderBottom: "1px solid rgba(212,175,55,0.2)",
            backdropFilter: "blur(10px)",
          }}>
            <button onClick={() => setShowCourses(false)} style={{
              background: "rgba(248,113,113,0.12)", color: "#f87171",
              border: "1px solid rgba(248,113,113,0.4)", borderRadius: "9px",
              padding: "8px 16px", fontFamily: "sans-serif", fontSize: "13px",
              fontWeight: "bold", cursor: "pointer",
            }}>← Class Tracker pe wapas</button>
          </div>
          <CoursesPage />
        </div>
      )}

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.07) 0%, transparent 60%)",
      }} />

      {/* NAVBAR */}
      <div style={{
        background: "rgba(212,175,55,0.08)", borderBottom: "1px solid rgba(212,175,55,0.25)",
        padding: "12px 14px", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#d4af37" }}>📖 Class Tracker</div>
            <div style={{ fontSize: "10px", color: "#a08040", fontFamily: "sans-serif" }}>SUNNY BHAI · Per-Class Log</div>
          </div>

          {/* Buttons — mobile mein wrap honge */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {globalTotalUnpaid > 0 && (
              <button onClick={() => setShowUnpaidPanel(p => !p)} style={{
                background: showUnpaidPanel ? "rgba(248,113,113,0.25)" : "rgba(248,113,113,0.12)",
                color: "#f87171", border: "1px solid rgba(248,113,113,0.5)",
                borderRadius: "9px", padding: "7px 10px",
                fontFamily: "sans-serif", fontSize: "11px", fontWeight: "bold", cursor: "pointer",
              }}>
                💰 {globalTotalUnpaid} unpaid
              </button>
            )}
            <button onClick={() => setShowCourses(true)} style={{
              background: "rgba(167,139,250,0.12)", color: "#a78bfa",
              border: "1px solid rgba(167,139,250,0.4)", borderRadius: "9px",
              padding: "7px 10px", fontFamily: "sans-serif", fontSize: "11px",
              fontWeight: "bold", cursor: "pointer",
            }}>📚 Courses</button>
            <button onClick={() => { setShowSchedule(s => !s); setShowForm(false); setEditingScheduleWeek(null); }} style={{
              background: showSchedule ? "rgba(96,165,250,0.2)" : "rgba(96,165,250,0.12)", color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.4)", borderRadius: "9px",
              padding: "7px 10px", fontFamily: "sans-serif", fontSize: "11px",
              fontWeight: "bold", cursor: "pointer",
            }}>📅 Schedule</button>
            <button onClick={showForm ? () => setShowForm(false) : openForm} style={{
              background: showForm ? "rgba(212,175,55,0.2)" : "linear-gradient(135deg, #d4af37, #b8960a)",
              color: showForm ? "#d4af37" : "#0f1923",
              border: showForm ? "1px solid #d4af37" : "none",
              borderRadius: "9px", padding: "7px 12px",
              fontFamily: "sans-serif", fontSize: "12px", fontWeight: "bold", cursor: "pointer",
              whiteSpace: "nowrap",
            }}>{showForm ? "✕" : "+ Add"}</button>
          </div>
        </div>

        {/* This Week Schedule Bar */}
        {thisWeekSchedule && thisWeekSchedule.days?.length > 0 && (
          <div style={{
            background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.35)",
            borderRadius: "12px", padding: "10px 12px", marginTop: "10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
              <div style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "sans-serif", fontWeight: "bold", textTransform: "uppercase" }}>📅 This Week</div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {thisWeekSchedule.days.sort((a,b) => DAYS.indexOf(a) - DAYS.indexOf(b)).map(day => {
                  const completed = isDayCompleted(thisWeekKey, day);
                  return (
                    <button key={day} onClick={() => toggleDayCompleted(thisWeekKey, day, thisWeekSchedule)} style={{
                      background: completed ? "rgba(74,222,128,0.2)" : "rgba(96,165,250,0.18)",
                      border: completed ? "1px solid rgba(74,222,128,0.6)" : "1px solid rgba(96,165,250,0.5)",
                      color: completed ? "#4ade80" : "#93c5fd",
                      borderRadius: "6px", padding: "3px 8px",
                      fontSize: "11px", fontFamily: "sans-serif", fontWeight: "bold", cursor: "pointer",
                    }}>
                      {completed ? "✓" : ""}{day}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const total = thisWeekSchedule.days.length;
                const done = thisWeekSchedule.days.filter(d => isDayCompleted(thisWeekKey, d)).length;
                const remaining = total - done;
                return (
                  <div style={{ display: "flex", gap: "4px" }}>
                    {done > 0 && <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "sans-serif", background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: "4px" }}>✓ {done} done</span>}
                    {remaining > 0 && <span style={{ fontSize: "10px", color: "#fbbf24", fontFamily: "sans-serif", background: "rgba(251,191,36,0.1)", padding: "2px 6px", borderRadius: "4px" }}>⏳ {remaining} left</span>}
                  </div>
                );
              })()}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "5px" }}>
                <span style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "monospace", background: "rgba(96,165,250,0.1)", padding: "2px 6px", borderRadius: "4px" }}>🇧🇪 {formatTime(thisWeekSchedule.belgiumTime)}</span>
                <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace", background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: "4px" }}>🇵🇰 {formatTime(belgiumToPakistan(thisWeekSchedule.belgiumTime))}</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: unpaidCount > 0 ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.08)",
                border: unpaidCount > 0 ? "1px solid rgba(248,113,113,0.35)" : "1px solid rgba(74,222,128,0.3)",
                borderRadius: "8px", padding: "4px 10px",
              }}>
                {unpaidCount > 0 ? (
                  <>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#f87171", fontFamily: "monospace" }}>{unpaidCount}</span>
                    <div style={{ fontFamily: "sans-serif" }}>
                      <div style={{ fontSize: "10px", color: "#f87171", fontWeight: "bold" }}>unpaid</div>
                      {unpaidAmount && <div style={{ fontSize: "11px", color: "#fca5a5" }}>${unpaidAmount}</div>}
                    </div>
                  </>
                ) : filtered.length > 0 ? (
                  <span style={{ fontSize: "11px", color: "#4ade80", fontFamily: "sans-serif", fontWeight: "bold" }}>✅ All paid!</span>
                ) : (
                  <span style={{ fontSize: "10px", color: "#4a5568", fontFamily: "sans-serif" }}>No classes</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "14px 12px 80px" }}>

        {/* GLOBAL UNPAID PANEL */}
        {showUnpaidPanel && globalTotalUnpaid > 0 && (
          <div style={{
            background: "rgba(10,20,35,0.97)", border: "1px solid rgba(248,113,113,0.4)",
            borderRadius: "16px", padding: "16px", marginBottom: "16px", animation: "fadeIn 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "14px", color: "#f87171", fontWeight: "bold" }}>💰 Pending Payments — All Months</div>
              <button onClick={() => setShowUnpaidPanel(false)} style={{ background: "rgba(255,255,255,0.08)", color: "#a08040", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontSize: "12px", fontFamily: "sans-serif" }}>✕</button>
            </div>
            {globalUnpaidByMonth.map(m => (
              <div key={m.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", marginBottom: "6px",
                background: m.key === activeMonth ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.04)",
                border: m.key === activeMonth ? "1px solid rgba(248,113,113,0.35)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: "10px", flexWrap: "wrap", gap: "6px",
              }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#e8d5b0", fontFamily: "sans-serif", fontWeight: "bold" }}>
                    {m.label} {m.key === activeMonth && <span style={{ fontSize: "10px", color: "#fbbf24", background: "rgba(251,191,36,0.15)", padding: "1px 6px", borderRadius: "4px", marginLeft: "4px" }}>current</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "#f87171", fontFamily: "sans-serif" }}>{m.unpaid} classes unpaid</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {m.amount !== null && <span style={{ fontSize: "15px", fontWeight: "bold", color: "#f87171", fontFamily: "monospace" }}>${m.amount.toFixed(2)}</span>}
                  <button onClick={() => { setActiveMonth(m.key); setShowUnpaidPanel(false); }} style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "7px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", fontFamily: "sans-serif" }}>View</button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", marginTop: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px" }}>
              <div style={{ fontSize: "13px", color: "#fca5a5", fontFamily: "sans-serif", fontWeight: "bold" }}>💰 Total Outstanding</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "#f87171", fontFamily: "sans-serif" }}>{globalTotalUnpaid} classes</span>
                {globalTotalAmount !== null && <span style={{ fontSize: "18px", fontWeight: "bold", color: "#f87171", fontFamily: "monospace" }}>${globalTotalAmount.toFixed(2)}</span>}
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE PANEL */}
        {showSchedule && (
          <div style={{
            background: "rgba(10,20,35,0.97)", border: "1px solid rgba(96,165,250,0.4)",
            borderRadius: "16px", padding: "16px", marginBottom: "16px", animation: "fadeIn 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "14px", color: "#60a5fa", fontWeight: "bold" }}>📅 Weekly Schedule</div>
              <button onClick={() => { setShowSchedule(false); setEditingScheduleWeek(null); }} style={{ background: "rgba(255,255,255,0.08)", color: "#a08040", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", fontFamily: "sans-serif" }}>✕ Close</button>
            </div>

            {savedScheduleWeeks.length > 0 && !editingScheduleWeek && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", color: "#60a5fa", fontFamily: "sans-serif", marginBottom: "8px", textTransform: "uppercase" }}>Saved Schedules</div>
                {savedScheduleWeeks.map(wk => {
                  const wr = getWeekRange(wk);
                  const wd = scheduleData[wk];
                  const isThisWeek = wk === thisWeekKey;
                  return (
                    <div key={wk} style={{
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      padding: "10px 12px", marginBottom: "6px",
                      background: isThisWeek ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.03)",
                      border: isThisWeek ? "1px solid rgba(96,165,250,0.3)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "10px", flexWrap: "wrap", gap: "8px",
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", color: "#e8d5b0", fontFamily: "sans-serif", fontWeight: "bold" }}>{formatDateShort(wr.start)} – {formatDateShort(wr.end)}</span>
                          {isThisWeek && <span style={{ fontSize: "10px", color: "#60a5fa", background: "rgba(96,165,250,0.15)", padding: "1px 7px", borderRadius: "4px", fontFamily: "sans-serif" }}>This Week</span>}
                        </div>
                        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                          {(wd.days || []).sort((a,b) => DAYS.indexOf(a)-DAYS.indexOf(b)).map(d => (
                            <span key={d} style={{ fontSize: "10px", color: "#93c5fd", fontFamily: "sans-serif", background: "rgba(96,165,250,0.1)", padding: "1px 6px", borderRadius: "4px" }}>{d}</span>
                          ))}
                          <span style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "monospace", background: "rgba(96,165,250,0.08)", padding: "1px 6px", borderRadius: "4px" }}>🇧🇪 {formatTime(wd.belgiumTime)}</span>
                          <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace", background: "rgba(74,222,128,0.08)", padding: "1px 6px", borderRadius: "4px" }}>🇵🇰 {formatTime(belgiumToPakistan(wd.belgiumTime))}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={() => { setEditingScheduleWeek(wk); setScheduleWeek(wk); const wd2 = scheduleData[wk]; setScheduleDays(wd2?.days || []); setBelgiumTime(wd2?.belgiumTime || "11:00"); }} style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "7px", padding: "5px 8px", fontSize: "11px", cursor: "pointer", fontFamily: "sans-serif" }}>✏️</button>
                        {deleteScheduleWeek === wk ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={() => deleteSchedule(wk)} style={{ background: "rgba(239,68,68,0.8)", color: "#fff", border: "none", borderRadius: "7px", padding: "5px 8px", fontSize: "11px", cursor: "pointer" }}>Del</button>
                            <button onClick={() => setDeleteScheduleWeek(null)} style={{ background: "rgba(255,255,255,0.08)", color: "#aaa", border: "none", borderRadius: "7px", padding: "5px 6px", fontSize: "11px", cursor: "pointer" }}>No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteScheduleWeek(wk)} style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "7px", padding: "5px 8px", fontSize: "11px", cursor: "pointer", fontFamily: "sans-serif" }}>🗑</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "10px", paddingTop: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#60a5fa", fontFamily: "sans-serif", marginBottom: "8px", textTransform: "uppercase" }}>+ Add New Schedule</div>
                </div>
              </div>
            )}

            {editingScheduleWeek && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", marginBottom: "12px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "10px" }}>
                <div style={{ fontSize: "12px", color: "#d4af37", fontFamily: "sans-serif", fontWeight: "bold" }}>✏️ Editing: {formatDateShort(getWeekRange(editingScheduleWeek).start)} – {formatDateShort(getWeekRange(editingScheduleWeek).end)}</div>
                <button onClick={() => setEditingScheduleWeek(null)} style={{ background: "rgba(255,255,255,0.06)", color: "#a08040", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", fontFamily: "sans-serif" }}>✕ Cancel</button>
              </div>
            )}

            {!editingScheduleWeek && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <button onClick={() => changeWeek(-1)} style={{ background: "rgba(255,255,255,0.06)", color: "#a08040", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "14px" }}>←</button>
                <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: "10px", padding: "10px" }}>
                  <div style={{ fontSize: "13px", color: "#e8d5b0", fontWeight: "bold", fontFamily: "sans-serif" }}>{formatDateShort(weekRange.start)} – {formatDateShort(weekRange.end)}</div>
                </div>
                <button onClick={() => changeWeek(1)} style={{ background: "rgba(255,255,255,0.06)", color: "#a08040", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "14px" }}>→</button>
                <button onClick={() => setScheduleWeek(getWeekRange(todayDate).start)} style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "8px", padding: "8px 8px", cursor: "pointer", fontSize: "10px", fontFamily: "sans-serif" }}>Today</button>
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <Label>Select Class Days</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {DAYS.map((day, i) => {
                  const selected = scheduleDays.includes(day);
                  const activeWeekStart = editingScheduleWeek || scheduleWeek;
                  const wr2 = getWeekRange(activeWeekStart);
                  const d = new Date(wr2.start + "T12:00:00");
                  d.setDate(d.getDate() + i);
                  return (
                    <button key={day} onClick={() => toggleScheduleDay(day)} style={{
                      background: selected ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.04)",
                      color: selected ? "#60a5fa" : "#6b7280",
                      border: selected ? "1px solid rgba(96,165,250,0.6)" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px", padding: "8px 2px",
                      cursor: "pointer", fontFamily: "sans-serif",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                    }}>
                      <span style={{ fontSize: "10px", fontWeight: "bold" }}>{day}</span>
                      <span style={{ fontSize: "11px", color: selected ? "#93c5fd" : "#4a5568" }}>{d.getDate()}</span>
                      {selected && <span style={{ fontSize: "10px" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <Label>Class Time</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(96,165,250,0.15)" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#60a5fa", marginBottom: "5px", fontFamily: "sans-serif" }}>🇧🇪 Belgium</div>
                  <input type="time" value={belgiumTime} onChange={e => setBelgiumTime(e.target.value)} style={{ width: "100%", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "8px", padding: "8px 10px", color: "#60a5fa", fontSize: "16px", fontFamily: "monospace", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#4ade80", marginBottom: "5px", fontFamily: "sans-serif" }}>🇵🇰 Pakistan</div>
                  <input type="time" value={pkTime} onChange={e => setBelgiumTime(pakistanToBelgium(e.target.value))} style={{ width: "100%", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px", padding: "8px 10px", color: "#4ade80", fontSize: "16px", fontFamily: "monospace", outline: "none" }} />
                </div>
              </div>
            </div>

            {scheduleDays.length > 0 && (
              <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#60a5fa", fontFamily: "sans-serif", marginBottom: "8px", textTransform: "uppercase" }}>📋 Preview</div>
                {scheduleDays.sort((a,b) => DAYS.indexOf(a) - DAYS.indexOf(b)).map(day => {
                  const activeWeekStart2 = editingScheduleWeek || scheduleWeek;
                  const wr3 = getWeekRange(activeWeekStart2);
                  const dayIdx = DAYS.indexOf(day);
                  const d = new Date(wr3.start + "T12:00:00");
                  d.setDate(d.getDate() + dayIdx);
                  return (
                    <div key={day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap", gap: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#e8d5b0", fontFamily: "sans-serif" }}>{DAYS_FULL[dayIdx]} — {formatDateShort(d.toISOString().slice(0,10))}</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <span style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "monospace", background: "rgba(96,165,250,0.1)", padding: "2px 6px", borderRadius: "4px" }}>🇧🇪 {formatTime(belgiumTime)}</span>
                        <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace", background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: "4px" }}>🇵🇰 {formatTime(pkTime)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => saveSchedule(editingScheduleWeek || scheduleWeek)} disabled={scheduleSaving} style={{
                flex: 1,
                background: scheduleSaving ? "rgba(96,165,250,0.3)" : "linear-gradient(135deg, rgba(96,165,250,0.85), rgba(59,130,246,0.95))",
                color: "#fff", border: "none", borderRadius: "10px",
                padding: "12px", fontSize: "14px", fontWeight: "bold",
                cursor: scheduleSaving ? "not-allowed" : "pointer", fontFamily: "sans-serif",
              }}>{scheduleSaving ? "✅ Saved!" : editingScheduleWeek ? "💾 Update" : "💾 Save Schedule"}</button>
              <button onClick={() => { setShowSchedule(false); setEditingScheduleWeek(null); }} style={{ background: "rgba(255,255,255,0.06)", color: "#a08040", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", cursor: "pointer", fontFamily: "sans-serif" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ADD CLASS FORM */}
        {showForm && (
          <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "16px", padding: "16px", marginBottom: "16px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: "14px", color: "#d4af37", marginBottom: "12px", fontWeight: "bold", fontFamily: "sans-serif" }}>✏️ Log New Class</div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div><Label>Start Time</Label><Input type="time" value={form.start} onChange={e => setForm(f=>({...f,start:e.target.value}))} /></div>
              <div><Label>End Time</Label><Input type="time" value={form.end} onChange={e => setForm(f=>({...f,end:e.target.value}))} /></div>
            </div>
            {duration(form.start, form.end) && (
              <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px", color: "#4ade80", fontFamily: "monospace", fontSize: "13px", textAlign: "center" }}>
                ⏱ {duration(form.start, form.end)} minutes
              </div>
            )}
            <Label>Notes (optional)</Label>
            <textarea placeholder="e.g. Surah Al-Baqarah revision..." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px", padding: "10px 12px", color: "#e8d5b0", fontSize: "13px", fontFamily: "sans-serif", outline: "none", resize: "none", marginBottom: "12px", boxSizing: "border-box" }} />
            <button onClick={addSession} disabled={saving} style={{
              width: "100%", background: saving ? "rgba(212,175,55,0.4)" : "linear-gradient(135deg, #d4af37, #b8960a)",
              color: "#0f1923", border: "none", borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: "bold",
              cursor: saving ? "not-allowed" : "pointer", fontFamily: "sans-serif",
            }}>{saving ? "⏳ Saving..." : "✓ Save Class"}</button>
          </div>
        )}

        {/* RATE */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#a08040", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>💵 Rate ($)</span>
          <input type="number" placeholder="e.g. 15" value={rate} onChange={e => setRate(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px", padding: "8px 12px", color: "#e8d5b0", fontSize: "16px", fontFamily: "monospace", outline: "none", minWidth: 0 }} />
          {rate && <span style={{ color: "#4ade80", fontSize: "12px", fontFamily: "monospace", whiteSpace: "nowrap" }}>${rate}/class</span>}
        </div>

        {/* MONTH DROPDOWN */}
        <div style={{ marginBottom: "12px" }}>
          <select value={activeMonth} onChange={e => setActiveMonth(e.target.value)} style={{ width: "100%", background: "#1a2940", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "10px", padding: "12px 16px", color: "#e8d5b0", fontSize: "14px", fontFamily: "sans-serif", outline: "none", cursor: "pointer" }}>
            {allMonths.map(m => {
              const [y, moo] = m.split("-").map(Number);
              const cnt = sessions.filter(s => s.date.startsWith(m)).length;
              const unpd = cnt - sessions.filter(s => s.date.startsWith(m) && s.paid).length;
              return <option key={m} value={m} style={{ background: "#1a2940" }}>{MONTHS_FULL[moo-1]} {y} — {cnt} classes {unpd > 0 ? `| ⚠ ${unpd} unpaid` : cnt > 0 ? "| ✓ All paid" : ""}</option>;
            })}
          </select>
        </div>

        {/* SUMMARY */}
        {filtered.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "14px 14px 0 0", padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <StatBox label="Total Classes" value={filtered.length} unit={monthLabel} color="#d4af37" />
              <StatBox label="Paid" value={paidCount} unit={paidAmount ? `$${paidAmount}` : "classes"} color="#4ade80" />
              <StatBox label="Unpaid" value={unpaidCount} unit={unpaidAmount ? `$${unpaidAmount}` : "classes"} color={unpaidCount > 0 ? "#f87171" : "#4ade80"} />
            </div>
            {unpaidCount > 0 ? (
              <div style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ color: "#f87171", fontFamily: "sans-serif", fontSize: "12px", fontWeight: "bold" }}>⚠️ {unpaidCount} unpaid{unpaidAmount ? ` — $${unpaidAmount}` : ""}</span>
                <button onClick={markAllPaid} style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.7), rgba(34,197,94,0.8))", color: "#0f1923", border: "none", borderRadius: "8px", padding: "7px 12px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", fontFamily: "sans-serif" }}>✓ Mark All Paid</button>
              </div>
            ) : (
              <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "10px 14px", textAlign: "center" }}>
                <span style={{ color: "#4ade80", fontFamily: "sans-serif", fontSize: "12px", fontWeight: "bold" }}>✅ {monthLabel} ka sara payment mil gaya!</span>
              </div>
            )}
          </div>
        )}

        {loading && <div style={{ textAlign: "center", padding: "40px", color: "#a08040", fontFamily: "sans-serif" }}>⏳ Loading...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a5568", fontFamily: "sans-serif", fontSize: "14px" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📚</div>
            No classes for {monthLabel}
          </div>
        )}

        {/* SESSION CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((s, i) => {
            const d = new Date(s.date + "T12:00:00");
            const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
            const dayNum = d.getDate();
            const monthShort = MONTHS[d.getMonth()];
            return (
              <div key={s._id} style={{
                background: s.paid ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.04)",
                border: deleteId === s._id ? "1px solid rgba(239,68,68,0.5)" : expandedId === s._id ? "1px solid rgba(212,175,55,0.4)" : s.paid ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px", overflow: "hidden", animation: "fadeIn 0.3s ease",
              }}>
                <div style={{ padding: "12px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "10px", padding: "6px 8px", textAlign: "center", minWidth: "40px", flexShrink: 0 }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#d4af37", lineHeight: 1 }}>{dayNum}</div>
                    <div style={{ fontSize: "9px", color: "#a08040", fontFamily: "sans-serif" }}>{monthShort}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", color: "#e8d5b0", fontFamily: "sans-serif", fontWeight: "bold" }}>{dayName}</span>
                      {s.start && <span style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "monospace", background: "rgba(96,165,250,0.1)", padding: "2px 5px", borderRadius: "4px" }}>{formatTime(s.start)}{s.end ? `–${formatTime(s.end)}` : ""}</span>}
                      {s.duration && <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace", background: "rgba(74,222,128,0.1)", padding: "2px 5px", borderRadius: "4px" }}>{s.duration}m</span>}
                    </div>
                    {s.notes && expandedId !== s._id && (
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {s.notes.slice(0,40)}{s.notes.length > 40 ? "…" : ""}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                    <button onClick={() => togglePaid(s._id, s.paid)} style={{
                      background: s.paid ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.12)",
                      color: s.paid ? "#4ade80" : "#f87171",
                      border: s.paid ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(248,113,113,0.4)",
                      borderRadius: "7px", padding: "5px 7px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap",
                    }}>{s.paid ? "✓ Paid" : "✗ Unpaid"}</button>
                    <button onClick={() => { setExpandedId(expandedId === s._id ? null : s._id); setEditingNotes(n => ({ ...n, [s._id]: s.notes })); }} style={{ background: expandedId === s._id ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)", color: expandedId === s._id ? "#d4af37" : "#6b7280", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "5px 6px", fontSize: "13px", cursor: "pointer" }}>📝</button>
                    {deleteId === s._id ? (
                      <>
                        <button onClick={() => deleteSession(s._id)} style={{ background: "rgba(239,68,68,0.8)", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 7px", fontSize: "11px", cursor: "pointer" }}>Del</button>
                        <button onClick={() => setDeleteId(null)} style={{ background: "rgba(255,255,255,0.1)", color: "#aaa", border: "none", borderRadius: "6px", padding: "5px 5px", fontSize: "11px", cursor: "pointer" }}>No</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteId(s._id)} style={{ background: "none", color: "#4a5568", border: "none", fontSize: "14px", cursor: "pointer", padding: "4px" }}>🗑</button>
                    )}
                  </div>
                </div>
                {expandedId === s._id && (
                  <div style={{ borderTop: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.04)", padding: "12px", animation: "fadeIn 0.2s ease" }}>
                    <div style={{ fontSize: "11px", color: "#a08040", marginBottom: "8px", fontFamily: "sans-serif", textTransform: "uppercase" }}>📖 Lesson Notes — {dayName} {dayNum} {monthShort}</div>
                    <textarea value={editingNotes[s._id] ?? s.notes ?? ""} onChange={e => setEditingNotes(n => ({ ...n, [s._id]: e.target.value }))} placeholder="Jo parhaya uska detail likhein..." rows={5}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px", padding: "10px 12px", color: "#e8d5b0", fontSize: "13px", fontFamily: "sans-serif", outline: "none", resize: "vertical", lineHeight: "1.6", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button onClick={() => saveNotes(s._id)} style={{ flex: 1, background: "linear-gradient(135deg, #d4af37, #b8960a)", color: "#0f1923", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", fontFamily: "sans-serif" }}>✓ Save Notes</button>
                      <button onClick={() => setExpandedId(null)} style={{ background: "rgba(255,255,255,0.06)", color: "#a08040", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "sans-serif" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sessions.length > 0 && (
          <div style={{ marginTop: "20px", textAlign: "center", color: "#4a5568", fontFamily: "sans-serif", fontSize: "12px" }}>
            Total: <span style={{ color: "#d4af37", fontWeight: "bold" }}>{sessions.length}</span> sessions
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(2) hue-rotate(5deg); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 2px; }
        select option { background: #1a2940; color: #e8d5b0; }
        button { touch-action: manipulation; }
      `}</style>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: "11px", color: "#a08040", marginBottom: "4px", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</div>;
}
function Input({ type, value, onChange, placeholder }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px", padding: "10px 12px", color: "#e8d5b0", fontSize: "16px", fontFamily: "monospace", outline: "none", marginBottom: "10px" }} />;
}
function StatBox({ label, value, unit, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "20px", fontWeight: "bold", color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "10px", color: "#a08040", marginTop: "2px", fontFamily: "sans-serif" }}>{label}</div>
      <div style={{ fontSize: "9px", color: "#4a5568", marginTop: "1px", fontFamily: "sans-serif" }}>{unit}</div>
    </div>
  );
}
