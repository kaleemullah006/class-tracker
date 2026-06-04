import { useState, useEffect } from "react";

const API = "/api/sessions";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { localStorage.setItem("class_rate", rate); }, [rate]);

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
    setShowForm(false);
    setSaving(false);
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

  const allMonths = [...new Set([...sessions.map(s => s.date.slice(0,7)), activeMonth])].sort().reverse();
  const filtered = sessions.filter(s => s.date.startsWith(activeMonth));
  const totalDur = filtered.reduce((a, s) => a + (s.duration || 0), 0);
  const paidCount = filtered.filter(s => s.paid).length;
  const unpaidCount = filtered.length - paidCount;
  const rateNum = parseFloat(rate) || 0;
  const paidAmount = rateNum ? (paidCount * rateNum).toFixed(2) : null;
  const unpaidAmount = rateNum ? (unpaidCount * rateNum).toFixed(2) : null;
  const [yr, mo] = activeMonth.split("-").map(Number);
  const monthLabel = `${MONTHS_FULL[mo-1]} ${yr}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1923 0%, #1a2940 50%, #0f2318 100%)",
      fontFamily: "'Georgia', serif",
      color: "#e8d5b0", overflowX: "hidden",
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.07) 0%, transparent 60%)",
      }} />

      {/* Header */}
      <div style={{
        background: "rgba(212,175,55,0.08)", borderBottom: "1px solid rgba(212,175,55,0.25)",
        padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#d4af37" }}>📖 Class Tracker</div>
          <div style={{ fontSize: "11px", color: "#a08040", fontFamily: "sans-serif" }}>Belgium Student · Per-Class Log</div>
        </div>
        <button onClick={showForm ? () => setShowForm(false) : openForm} style={{
          background: showForm ? "rgba(212,175,55,0.2)" : "linear-gradient(135deg, #d4af37, #b8960a)",
          color: showForm ? "#d4af37" : "#0f1923",
          border: showForm ? "1px solid #d4af37" : "none",
          borderRadius: "10px", padding: "10px 14px",
          fontFamily: "sans-serif", fontSize: "13px", fontWeight: "bold", cursor: "pointer",
          whiteSpace: "nowrap",
        }}>
          {showForm ? "✕ Cancel" : "+ Add Class"}
        </button>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "12px 12px 80px" }}>

        {/* Add Class Form */}
        {showForm && (
          <div style={{
            background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "16px", padding: "16px", marginBottom: "16px", animation: "fadeIn 0.2s ease",
          }}>
            <div style={{ fontSize: "14px", color: "#d4af37", marginBottom: "12px", fontWeight: "bold", fontFamily: "sans-serif" }}>
              ✏️ Log New Class
            </div>

            {/* Date full width */}
            <Label>Date (auto-filled)</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />

            {/* Time row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={form.start} onChange={e => setForm(f=>({...f,start:e.target.value}))} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={form.end} onChange={e => setForm(f=>({...f,end:e.target.value}))} />
              </div>
            </div>

            {/* Duration badge */}
            {duration(form.start, form.end) && (
              <div style={{
                background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                borderRadius: "8px", padding: "8px 12px", marginBottom: "10px",
                color: "#4ade80", fontFamily: "monospace", fontSize: "13px", textAlign: "center",
              }}>
                ⏱ {duration(form.start, form.end)} minutes
              </div>
            )}

            <Label>Notes (optional)</Label>
            <textarea
              placeholder="e.g. Surah Al-Baqarah revision..."
              value={form.notes}
              onChange={e => setForm(f=>({...f,notes:e.target.value}))}
              rows={3}
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px",
                padding: "10px 12px", color: "#e8d5b0", fontSize: "13px",
                fontFamily: "sans-serif", outline: "none", resize: "none",
                marginBottom: "12px", boxSizing: "border-box",
              }}
            />

            <button onClick={addSession} disabled={saving} style={{
              width: "100%",
              background: saving ? "rgba(212,175,55,0.4)" : "linear-gradient(135deg, #d4af37, #b8960a)",
              color: "#0f1923", border: "none", borderRadius: "10px",
              padding: "14px", fontSize: "15px", fontWeight: "bold",
              cursor: saving ? "not-allowed" : "pointer", fontFamily: "sans-serif",
            }}>
              {saving ? "⏳ Saving..." : "✓ Save Class"}
            </button>
          </div>
        )}

        {/* Rate Setting */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", padding: "12px 14px", marginBottom: "12px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "13px", color: "#a08040", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>
            💵 Rate ($)
          </span>
          <input type="number" placeholder="e.g. 15" value={rate} onChange={e => setRate(e.target.value)}
            style={{
              flex: 1, background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px",
              padding: "8px 12px", color: "#e8d5b0", fontSize: "14px",
              fontFamily: "monospace", outline: "none", minWidth: 0,
            }}
          />
          {rate && <span style={{ color: "#4ade80", fontSize: "12px", fontFamily: "monospace", whiteSpace: "nowrap" }}>${rate}/class</span>}
        </div>

        {/* Month Dropdown */}
        <div style={{ marginBottom: "12px" }}>
          <select
            value={activeMonth}
            onChange={e => setActiveMonth(e.target.value)}
            style={{
              width: "100%", background: "#1a2940",
              border: "1px solid rgba(212,175,55,0.4)", borderRadius: "10px",
              padding: "12px 16px", color: "#e8d5b0", fontSize: "14px",
              fontFamily: "sans-serif", outline: "none", cursor: "pointer",
            }}
          >
            {allMonths.map(m => {
              const [y, mo] = m.split("-").map(Number);
              const cnt = sessions.filter(s => s.date.startsWith(m)).length;
              const unpd = cnt - sessions.filter(s => s.date.startsWith(m) && s.paid).length;
              return (
                <option key={m} value={m} style={{ background: "#1a2940" }}>
                  {MONTHS_FULL[mo-1]} {y} — {cnt} classes {unpd > 0 ? `| ⚠ ${unpd} unpaid` : cnt > 0 ? "| ✓ All paid" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Monthly Summary */}
        {filtered.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{
              background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: "14px 14px 0 0", padding: "14px 16px",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px",
            }}>
              <StatBox label="Classes" value={filtered.length} unit={monthLabel} color="#d4af37" />
              <StatBox label="Paid" value={paidCount} unit={paidAmount ? `$${paidAmount}` : "classes"} color="#4ade80" />
              <StatBox label="Unpaid" value={unpaidCount} unit={unpaidAmount ? `$${unpaidAmount}` : "classes"} color={unpaidCount > 0 ? "#f87171" : "#4ade80"} />
            </div>
            {unpaidCount > 0 ? (
              <div style={{
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.35)",
                borderTop: "none", borderRadius: "0 0 14px 14px",
                padding: "10px 14px",
              }}>
                <span style={{ color: "#f87171", fontFamily: "sans-serif", fontSize: "12px", fontWeight: "bold" }}>
                  ⚠️ {unpaidCount} class{unpaidCount > 1 ? "es" : ""} ka payment baaki — {unpaidAmount ? `$${unpaidAmount} pending` : ""}
                </span>
              </div>
            ) : (
              <div style={{
                background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)",
                borderTop: "none", borderRadius: "0 0 14px 14px",
                padding: "10px 14px", textAlign: "center",
              }}>
                <span style={{ color: "#4ade80", fontFamily: "sans-serif", fontSize: "12px", fontWeight: "bold" }}>
                  ✅ {monthLabel} ka sara payment mil gaya!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#a08040", fontFamily: "sans-serif" }}>
            ⏳ Loading...
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a5568", fontFamily: "sans-serif", fontSize: "14px" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📚</div>
            No classes for {monthLabel}
          </div>
        )}

        {/* Session Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((s, i) => {
            const d = new Date(s.date + "T12:00:00");
            const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
            const dayNum = d.getDate();
            const monthShort = MONTHS[d.getMonth()];

            return (
              <div key={s._id} style={{
                background: s.paid ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.04)",
                border: deleteId === s._id ? "1px solid rgba(239,68,68,0.5)"
                  : expandedId === s._id ? "1px solid rgba(212,175,55,0.4)"
                  : s.paid ? "1px solid rgba(74,222,128,0.2)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px", overflow: "hidden", animation: "fadeIn 0.3s ease",
              }}>
                {/* Card Top Row */}
                <div style={{ padding: "12px 12px", display: "flex", alignItems: "center", gap: "10px" }}>

                  {/* Day Badge */}
                  <div style={{
                    background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)",
                    borderRadius: "10px", padding: "6px 8px", textAlign: "center", minWidth: "42px", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: "17px", fontWeight: "bold", color: "#d4af37", lineHeight: 1 }}>{dayNum}</div>
                    <div style={{ fontSize: "9px", color: "#a08040", fontFamily: "sans-serif", marginTop: "1px" }}>{monthShort}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", color: "#e8d5b0", fontFamily: "sans-serif", fontWeight: "bold" }}>{dayName}</span>
                      {s.start && (
                        <span style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "monospace", background: "rgba(96,165,250,0.1)", padding: "2px 6px", borderRadius: "5px" }}>
                          {formatTime(s.start)}{s.end ? `–${formatTime(s.end)}` : ""}
                        </span>
                      )}
                      {s.duration && (
                        <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace", background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: "5px" }}>
                          {s.duration}m
                        </span>
                      )}
                    </div>
                    {s.notes && expandedId !== s._id && (
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📝 {s.notes.slice(0,45)}{s.notes.length > 45 ? "…" : ""}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {/* Payment */}
                    <button onClick={() => togglePaid(s._id, s.paid)} style={{
                      background: s.paid ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.12)",
                      color: s.paid ? "#4ade80" : "#f87171",
                      border: s.paid ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(248,113,113,0.4)",
                      borderRadius: "7px", padding: "5px 8px",
                      fontSize: "11px", fontWeight: "bold", cursor: "pointer",
                      fontFamily: "sans-serif", whiteSpace: "nowrap",
                    }}>
                      {s.paid ? "✓ Paid" : "✗ Unpaid"}
                    </button>

                    {/* Notes */}
                    <button onClick={() => {
                      setExpandedId(expandedId === s._id ? null : s._id);
                      setEditingNotes(n => ({ ...n, [s._id]: s.notes }));
                    }} style={{
                      background: expandedId === s._id ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)",
                      color: expandedId === s._id ? "#d4af37" : "#6b7280",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px", padding: "5px 7px", fontSize: "13px", cursor: "pointer",
                    }}>📝</button>

                    {/* Delete */}
                    {deleteId === s._id ? (
                      <>
                        <button onClick={() => deleteSession(s._id)} style={{ background: "rgba(239,68,68,0.8)", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 8px", fontSize: "11px", cursor: "pointer" }}>Del</button>
                        <button onClick={() => setDeleteId(null)} style={{ background: "rgba(255,255,255,0.1)", color: "#aaa", border: "none", borderRadius: "6px", padding: "5px 6px", fontSize: "11px", cursor: "pointer" }}>No</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteId(s._id)} style={{ background: "none", color: "#4a5568", border: "none", fontSize: "15px", cursor: "pointer", padding: "4px" }}>🗑</button>
                    )}
                  </div>
                </div>

                {/* Notes Panel */}
                {expandedId === s._id && (
                  <div style={{ borderTop: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.04)", padding: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#a08040", marginBottom: "8px", fontFamily: "sans-serif", textTransform: "uppercase" }}>
                      📖 Lesson Notes — {dayName} {dayNum} {monthShort}
                    </div>
                    <textarea
                      value={editingNotes[s._id] ?? s.notes ?? ""}
                      onChange={e => setEditingNotes(n => ({ ...n, [s._id]: e.target.value }))}
                      placeholder="Jo parhaya uska detail likhein..."
                      rows={5}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px",
                        padding: "10px 12px", color: "#e8d5b0", fontSize: "13px",
                        fontFamily: "sans-serif", outline: "none", resize: "vertical",
                        lineHeight: "1.6", boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button onClick={() => saveNotes(s._id)} style={{
                        flex: 1, background: "linear-gradient(135deg, #d4af37, #b8960a)",
                        color: "#0f1923", border: "none", borderRadius: "8px",
                        padding: "10px", fontSize: "13px", fontWeight: "bold",
                        cursor: "pointer", fontFamily: "sans-serif",
                      }}>✓ Save Notes</button>
                      <button onClick={() => setExpandedId(null)} style={{
                        background: "rgba(255,255,255,0.06)", color: "#a08040",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                        padding: "10px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "sans-serif",
                      }}>Cancel</button>
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
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(2) hue-rotate(5deg); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 2px; }
        select option { background: #1a2940; color: #e8d5b0; }
        button { touch-action: manipulation; }
        @media (max-width: 400px) {
          .stat-value { font-size: 18px !important; }
        }
      `}</style>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: "11px", color: "#a08040", marginBottom: "4px", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</div>;
}

function Input({ type, value, onChange, placeholder }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: "100%", background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(212,175,55,0.25)", borderRadius: "8px",
        padding: "10px 12px", color: "#e8d5b0", fontSize: "16px",
        fontFamily: "monospace", outline: "none", marginBottom: "10px",
      }}
    />
  );
}

function StatBox({ label, value, unit, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="stat-value" style={{ fontSize: "20px", fontWeight: "bold", color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "10px", color: "#a08040", marginTop: "2px", fontFamily: "sans-serif" }}>{label}</div>
      <div style={{ fontSize: "9px", color: "#4a5568", marginTop: "1px", fontFamily: "sans-serif" }}>{unit}</div>
    </div>
  );
}
