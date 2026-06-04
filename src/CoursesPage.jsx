import { useState, useEffect, useRef } from "react";

const API = "/api";

const NAMAZ_DATA = [
  {
    id: "niyyat",
    title: "Niyyat (Intention)",
    icon: "🤲",
    steps: [
      { label: "Niyyat", text: "Nawaytu an usalli lillahi ta'ala [X] raka'atin salata [Fajr/Zuhr/Asr/Maghrib/Isha] [fardhan/sunnat] mustaqbilal qiblati, Allahu Akbar." },
    ]
  },
  {
    id: "sana",
    title: "Sana (Thana)",
    icon: "✨",
    steps: [
      { label: "Sana", text: "Subhanakal-lahumma wa bihamdika wa tabarakas-muka wa ta'ala jadduka wa la ilaha ghairuk." },
    ]
  },
  {
    id: "taawwuz",
    title: "Ta'awwuz & Tasmiyah",
    icon: "🛡️",
    steps: [
      { label: "Ta'awwuz", text: "A'udhu billahi minash-shaytanir-rajeem." },
      { label: "Tasmiyah", text: "Bismillahir-rahmanir-raheem." },
    ]
  },
  {
    id: "fatiha",
    title: "Surah Al-Fatiha",
    icon: "📖",
    steps: [
      { label: "", text: "Alhamdu lillahi rabbil-'aalameen.\nAr-rahmanir-raheem.\nMaliki yawmid-deen.\nIyyaka na'budu wa iyyaka nasta'een.\nIhdinas-siratal-mustaqeem.\nSirathal-ladheena an'amta 'alayhim.\nGhayril-maghdubi 'alayhim wa lad-daalleen.\nAmeen." },
    ]
  },
  {
    id: "ruku",
    title: "Ruku",
    icon: "🙇",
    steps: [
      { label: "Ruku mein jaate waqt", text: "Allahu Akbar" },
      { label: "Ruku ki tasbeeh (3 baar)", text: "Subhana rabbiyal-'azeem." },
      { label: "Ruku se uthte waqt", text: "Sami'allahu liman hamidah." },
      { label: "Seedha khade ho kar", text: "Rabbana lakal-hamd." },
    ]
  },
  {
    id: "sajda",
    title: "Sajda (Sujood)",
    icon: "🙏",
    steps: [
      { label: "Sajde mein jaate waqt", text: "Allahu Akbar" },
      { label: "Sajde ki tasbeeh (3 baar)", text: "Subhana rabbiyal-a'la." },
      { label: "Uthte waqt", text: "Allahu Akbar" },
      { label: "Do sajdon ke darmiyan", text: "Rabbighfir lee, rabbighfir lee." },
      { label: "Doosra sajda (3 baar)", text: "Subhana rabbiyal-a'la." },
      { label: "Uthte waqt", text: "Allahu Akbar" },
    ]
  },
  {
    id: "tashahhud",
    title: "Tashahhud (At-tahiyyat)",
    icon: "☝️",
    steps: [
      { label: "At-tahiyyat", text: "At-tahiyyatu lillahi was-salawatu wat-tayyibaat.\nAs-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh.\nAs-salamu 'alayna wa 'ala 'ibadillahis-saaliheen.\nAshhadu alla ilaha illallah,\nwa ashhadu anna Muhammadan 'abduhu wa rasuluh." },
    ]
  },
  {
    id: "durood",
    title: "Durood Ibrahim",
    icon: "💚",
    steps: [
      { label: "Durood Ibrahim", text: "Allahumma salli 'ala Muhammadin wa 'ala aali Muhammadin,\nkama sallayta 'ala Ibrahima wa 'ala aali Ibraheem,\ninnaka Hameedum Majeed.\n\nAllahumma barik 'ala Muhammadin wa 'ala aali Muhammadin,\nkama barakta 'ala Ibrahima wa 'ala aali Ibraheem,\ninnaka Hameedum Majeed." },
    ]
  },
  {
    id: "dua-masura",
    title: "Dua-e-Masura",
    icon: "🌟",
    steps: [
      { label: "Dua-e-Masura", text: "Allahumma inni zalamtu nafsi zulman katheera,\nwa la yaghfirudh-dhunuba illa ant,\nfaghfir li maghfiratan min 'indika,\nwarhamni, innaka antal-Ghafurur-Raheem." },
    ]
  },
  {
    id: "salaam",
    title: "Salaam (Salam pherna)",
    icon: "🕊️",
    steps: [
      { label: "Dahni taraf", text: "As-salamu 'alaykum wa rahmatullah." },
      { label: "Bayi taraf", text: "As-salamu 'alaykum wa rahmatullah." },
    ]
  },
  {
    id: "namaz-types",
    title: "Namaz ke Waqt aur Raka'at",
    icon: "🕐",
    steps: [
      { label: "Fajr", text: "2 Sunnat (Muakkada) + 2 Fardh" },
      { label: "Zuhr", text: "4 Sunnat (Muakkada) + 4 Fardh + 2 Sunnat (Muakkada) + 2 Nafl" },
      { label: "Asr", text: "4 Sunnat (Ghair Muakkada) + 4 Fardh" },
      { label: "Maghrib", text: "3 Fardh + 2 Sunnat (Muakkada) + 2 Nafl" },
      { label: "Isha", text: "4 Sunnat (Ghair Muakkada) + 4 Fardh + 2 Sunnat (Muakkada) + 2 Nafl + 3 Witr (Waajib)" },
    ]
  },
];

const SECTION_COLORS = {
  qaida:  { bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.35)",  accent: "#60a5fa",  light: "rgba(96,165,250,0.15)"  },
  namaz:  { bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.35)",  accent: "#4ade80",  light: "rgba(74,222,128,0.15)"  },
  dua:    { bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.35)",  accent: "#fbbf24",  light: "rgba(251,191,36,0.15)"  },
  quran:  { bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.35)", accent: "#a78bfa",  light: "rgba(167,139,250,0.15)" },
  hadees: { bg: "rgba(251,113,133,0.06)", border: "rgba(251,113,133,0.35)", accent: "#fb7185",  light: "rgba(251,113,133,0.15)" },
};

const SECTIONS = [
  { id: "qaida",  label: "Noorani Qaida", icon: "📖", desc: "Quran padhne ki bunyad" },
  { id: "namaz",  label: "Namaz",         icon: "🕌", desc: "Poori namaz Roman English mein" },
  { id: "dua",    label: "Dua",           icon: "🤲", desc: "Duain paste ya type karein" },
  { id: "quran",  label: "Quran Majeed",  icon: "📿", desc: "Surahen add karein" },
  { id: "hadees", label: "Ahadees",       icon: "📜", desc: "Roz ki ahadees" },
];

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function CoursesPage() {
  const [activeSection, setActiveSection] = useState(null);
  const [pdfExists, setPdfExists] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMsg, setPdfMsg] = useState("");
  const pdfInputRef = useRef();

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", category: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedNamaz, setExpandedNamaz] = useState(null);

  const PDF_URL = `${window.location.origin}/uploads/noorani-qaida.pdf`;

  useEffect(() => {
    fetch(`${API}/pdf/check`)
      .then(r => r.json())
      .then(d => setPdfExists(d.exists))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeSection && ["dua", "quran", "hadees"].includes(activeSection)) {
      loadItems(activeSection);
    }
  }, [activeSection]);

  const loadItems = async (type) => {
    setLoadingItems(true);
    setItems([]);
    try {
      const res = await fetch(`${API}/courses/${type}`);
      const data = await res.json();
      setItems(data);
    } catch (e) { console.error(e); }
    setLoadingItems(false);
  };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    setPdfUploading(true);
    setPdfMsg("");
    const fd = new FormData();
    fd.append("pdf", file);
    try {
      const res = await fetch(`${API}/pdf/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setPdfExists(true); setPdfMsg("✅ PDF upload ho gayi!"); }
      else setPdfMsg("❌ Upload fail: " + (data.error || ""));
    } catch (e) { setPdfMsg("❌ Server error"); }
    setPdfUploading(false);
  };

  const saveItem = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API}/courses/${activeSection}/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const updated = await res.json();
        setItems(prev => prev.map(i => i._id === editingId ? updated : i));
        setEditingId(null);
      } else {
        const res = await fetch(`${API}/courses/${activeSection}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const newItem = await res.json();
        setItems(prev => [newItem, ...prev]);
      }
      setFormData({ title: "", content: "", category: "" });
      setShowAddForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const deleteItem = async (id) => {
    await fetch(`${API}/courses/${activeSection}/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i._id !== id));
    setDeleteId(null);
    setExpandedItem(null);
  };

  const startEdit = (item) => {
    setFormData({ title: item.title, content: item.content, category: item.category || "" });
    setEditingId(item._id);
    setShowAddForm(true);
    setExpandedItem(null);
  };

  const col = activeSection ? SECTION_COLORS[activeSection] : SECTION_COLORS.qaida;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1923 0%, #1a2940 50%, #0f2318 100%)",
      fontFamily: "'Georgia', serif",
      color: "#e8d5b0",
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.07) 0%, transparent 60%)",
      }} />

      {/* Navbar */}
      <div style={{
        background: "rgba(212,175,55,0.08)", borderBottom: "1px solid rgba(212,175,55,0.25)",
        padding: "14px 16px", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {activeSection && (
            <button onClick={() => { setActiveSection(null); setShowAddForm(false); setEditingId(null); }} style={{
              background: "rgba(255,255,255,0.06)", color: "#a08040",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
              padding: "7px 12px", cursor: "pointer", fontSize: "14px",
            }}>← Back</button>
          )}
          <div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#d4af37" }}>
              {activeSection
                ? `${SECTIONS.find(s => s.id === activeSection)?.icon} ${SECTIONS.find(s => s.id === activeSection)?.label}`
                : "📚 Courses"}
            </div>
            <div style={{ fontSize: "11px", color: "#a08040", fontFamily: "sans-serif" }}>
              {activeSection
                ? SECTIONS.find(s => s.id === activeSection)?.desc
                : "Islamic Learning Hub"}
            </div>
          </div>
        </div>

        {activeSection && ["dua", "quran", "hadees"].includes(activeSection) && (
          <button onClick={() => {
            if (showAddForm) { setShowAddForm(false); setEditingId(null); setFormData({ title: "", content: "", category: "" }); }
            else setShowAddForm(true);
          }} style={{
            background: showAddForm ? "rgba(212,175,55,0.2)" : `linear-gradient(135deg, ${col.accent}, ${col.accent}cc)`,
            color: showAddForm ? "#d4af37" : "#0f1923",
            border: showAddForm ? `1px solid ${col.accent}` : "none",
            borderRadius: "9px", padding: "9px 14px",
            fontFamily: "sans-serif", fontSize: "13px", fontWeight: "bold", cursor: "pointer",
            whiteSpace: "nowrap",
          }}>{showAddForm ? "✕ Cancel" : `+ Add`}</button>
        )}
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px 12px 80px" }}>

        {/* Home Grid */}
        {!activeSection && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px", paddingTop: "8px" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🕌</div>
              <div style={{ fontSize: "20px", color: "#d4af37", fontWeight: "bold" }}>Islamic Learning Hub</div>
              <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "sans-serif", marginTop: "4px" }}>
                Ek jagah — Qaida, Namaz, Dua, Quran, Ahadees
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {SECTIONS.map(sec => {
                const c = SECTION_COLORS[sec.id];
                return (
                  <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: "16px", padding: "16px 18px",
                    cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    animation: "fadeIn 0.3s ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        fontSize: "26px", background: c.light,
                        borderRadius: "12px", padding: "10px",
                        border: `1px solid ${c.border}`,
                      }}>{sec.icon}</div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "bold", color: c.accent }}>{sec.label}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "sans-serif", marginTop: "2px" }}>{sec.desc}</div>
                      </div>
                    </div>
                    <div style={{ color: c.accent, fontSize: "20px" }}>›</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Noorani Qaida */}
        {activeSection === "qaida" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Upload section */}
            <div style={{
              background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.3)",
              borderRadius: "14px", padding: "16px 18px", marginBottom: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#60a5fa", fontWeight: "bold", marginBottom: "4px" }}>
                    📄 Noorani Qaida PDF
                  </div>
                  <div style={{ fontSize: "12px", color: "#4a5568", fontFamily: "sans-serif" }}>
                    {pdfExists ? "✅ PDF available hai" : "⚠️ PDF upload nahi hui abhi"}
                  </div>
                  {pdfMsg && (
                    <div style={{ fontSize: "12px", color: pdfExists ? "#4ade80" : "#f87171", marginTop: "4px", fontFamily: "sans-serif" }}>
                      {pdfMsg}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: "none" }}
                    onChange={e => handlePdfUpload(e.target.files[0])} />
                  <button onClick={() => pdfInputRef.current?.click()} disabled={pdfUploading} style={{
                    background: "rgba(96,165,250,0.15)", color: "#60a5fa",
                    border: "1px solid rgba(96,165,250,0.4)", borderRadius: "8px",
                    padding: "8px 14px", fontSize: "12px", fontWeight: "bold",
                    cursor: pdfUploading ? "not-allowed" : "pointer", fontFamily: "sans-serif",
                  }}>{pdfUploading ? "⏳ Uploading..." : "📤 PDF Upload"}</button>
                </div>
              </div>
            </div>

            {/* PDF Viewer / Mobile Button */}
            {pdfExists ? (
              <div style={{
                background: "rgba(10,20,35,0.8)", border: "1px solid rgba(96,165,250,0.3)",
                borderRadius: "14px", overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px", background: "rgba(96,165,250,0.08)",
                  borderBottom: "1px solid rgba(96,165,250,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: "8px",
                }}>
                  <span style={{ color: "#60a5fa", fontSize: "13px", fontFamily: "sans-serif", fontWeight: "bold" }}>
                    📖 Noorani Qaida
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a href={PDF_URL} target="_blank" rel="noreferrer" style={{
                      color: "#60a5fa", fontSize: "12px", fontFamily: "sans-serif",
                      background: "rgba(96,165,250,0.12)", padding: "5px 12px",
                      borderRadius: "6px", textDecoration: "none",
                      border: "1px solid rgba(96,165,250,0.3)",
                    }}>📖 Open PDF</a>
                    <a href={PDF_URL} download style={{
                      color: "#4ade80", fontSize: "12px", fontFamily: "sans-serif",
                      background: "rgba(74,222,128,0.12)", padding: "5px 12px",
                      borderRadius: "6px", textDecoration: "none",
                      border: "1px solid rgba(74,222,128,0.3)",
                    }}>⬇️ Download</a>
                  </div>
                </div>

                {/* Mobile: Button only | Desktop: iframe */}
                {isMobile ? (
                  <div style={{
                    textAlign: "center", padding: "40px 20px",
                    background: "rgba(96,165,250,0.04)",
                  }}>
                    <div style={{ fontSize: "48px", marginBottom: "14px" }}>📄</div>
                    <div style={{ color: "#a08040", fontSize: "13px", marginBottom: "20px", fontFamily: "sans-serif" }}>
                      Mobile par PDF directly open hogi
                    </div>
                    <a href={PDF_URL} target="_blank" rel="noreferrer" style={{
                      display: "inline-block",
                      background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                      color: "#fff", textDecoration: "none",
                      borderRadius: "14px", padding: "16px 32px",
                      fontSize: "16px", fontWeight: "bold", fontFamily: "sans-serif",
                      boxShadow: "0 4px 20px rgba(96,165,250,0.3)",
                    }}>
                      📖 Noorani Qaida Kholen
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={PDF_URL}
                    title="Noorani Qaida"
                    style={{ width: "100%", height: "75vh", border: "none", display: "block" }}
                  />
                )}
              </div>
            ) : (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                background: "rgba(96,165,250,0.04)", border: "1px dashed rgba(96,165,250,0.3)",
                borderRadius: "14px",
              }}>
                <div style={{ fontSize: "50px", marginBottom: "14px" }}>📄</div>
                <div style={{ color: "#60a5fa", fontSize: "15px", marginBottom: "8px" }}>PDF abhi upload nahi hui</div>
                <div style={{ color: "#4a5568", fontSize: "12px", fontFamily: "sans-serif", marginBottom: "16px" }}>
                  Upar "PDF Upload" button se Noorani Qaida PDF upload karein
                </div>
                <button onClick={() => pdfInputRef.current?.click()} style={{
                  background: "rgba(96,165,250,0.15)", color: "#60a5fa",
                  border: "1px solid rgba(96,165,250,0.4)", borderRadius: "10px",
                  padding: "12px 24px", fontSize: "14px", cursor: "pointer", fontFamily: "sans-serif",
                }}>📤 Upload Noorani Qaida PDF</button>
              </div>
            )}
          </div>
        )}

        {/* Namaz */}
        {activeSection === "namaz" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ fontSize: "18px" }}>ℹ️</span>
              <div style={{ fontSize: "12px", color: "#4ade80", fontFamily: "sans-serif" }}>
                Poori namaz Roman English mein — Niyyat se Salaam tak. Kisi bhi step pe tap karein.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {NAMAZ_DATA.map(section => (
                <div key={section.id} style={{
                  background: expandedNamaz === section.id ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${expandedNamaz === section.id ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "12px", overflow: "hidden",
                }}>
                  <button onClick={() => setExpandedNamaz(expandedNamaz === section.id ? null : section.id)} style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    color: "#e8d5b0", textAlign: "left",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "20px" }}>{section.icon}</span>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: "#4ade80" }}>{section.title}</span>
                    </div>
                    <span style={{ color: "#4a5568", fontSize: "16px" }}>{expandedNamaz === section.id ? "▲" : "▼"}</span>
                  </button>

                  {expandedNamaz === section.id && (
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(74,222,128,0.15)" }}>
                      {section.steps.map((step, i) => (
                        <div key={i} style={{
                          marginTop: "10px",
                          background: "rgba(74,222,128,0.05)",
                          border: "1px solid rgba(74,222,128,0.15)",
                          borderRadius: "10px", padding: "12px 14px",
                        }}>
                          {step.label && (
                            <div style={{ fontSize: "11px", color: "#4ade80", fontFamily: "sans-serif", fontWeight: "bold", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {step.label}
                            </div>
                          )}
                          <div style={{ fontSize: "14px", color: "#e8d5b0", lineHeight: "1.8", whiteSpace: "pre-line" }}>
                            {step.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dua / Quran / Hadees */}
        {activeSection && ["dua", "quran", "hadees"].includes(activeSection) && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {showAddForm && (
              <div style={{
                background: col.bg, border: `1px solid ${col.border}`,
                borderRadius: "14px", padding: "16px", marginBottom: "16px",
                animation: "fadeIn 0.2s ease",
              }}>
                <div style={{ fontSize: "14px", color: col.accent, fontWeight: "bold", marginBottom: "12px" }}>
                  {editingId ? "✏️ Edit" : "➕ Naya"} {SECTIONS.find(s => s.id === activeSection)?.label}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <Label color={col.accent}>Title *</Label>
                  <TextInput value={formData.title} onChange={v => setFormData(f => ({ ...f, title: v }))}
                    placeholder={activeSection === "dua" ? "e.g. Dua-e-Qunoot" : activeSection === "quran" ? "e.g. Surah Al-Ikhlas" : "e.g. Sahih Bukhari"}
                    accent={col.accent} />
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <Label color={col.accent}>Category (optional)</Label>
                  <TextInput value={formData.category} onChange={v => setFormData(f => ({ ...f, category: v }))}
                    placeholder="e.g. Morning, Safar, Iman..."
                    accent={col.accent} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <Label color={col.accent}>Content *</Label>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData(f => ({ ...f, content: e.target.value }))}
                    placeholder="Yahan text paste ya type karein..."
                    rows={7}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${col.border}`, borderRadius: "8px",
                      padding: "10px 12px", color: "#e8d5b0", fontSize: "13px",
                      fontFamily: "sans-serif", outline: "none", resize: "vertical",
                      lineHeight: "1.7", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={saveItem} disabled={saving || !formData.title.trim() || !formData.content.trim()} style={{
                    flex: 1,
                    background: saving ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, ${col.accent}, ${col.accent}bb)`,
                    color: "#0f1923", border: "none", borderRadius: "10px",
                    padding: "12px", fontSize: "14px", fontWeight: "bold",
                    cursor: saving ? "not-allowed" : "pointer", fontFamily: "sans-serif",
                  }}>{saving ? "⏳ Saving..." : editingId ? "💾 Update" : "💾 Save"}</button>
                  <button onClick={() => { setShowAddForm(false); setEditingId(null); setFormData({ title: "", content: "", category: "" }); }} style={{
                    background: "rgba(255,255,255,0.06)", color: "#a08040",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px",
                    padding: "12px 16px", fontSize: "14px", cursor: "pointer", fontFamily: "sans-serif",
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {loadingItems ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#a08040", fontFamily: "sans-serif" }}>⏳ Loading...</div>
            ) : items.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                background: col.bg, border: `1px dashed ${col.border}`, borderRadius: "14px",
              }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>{SECTIONS.find(s => s.id === activeSection)?.icon}</div>
                <div style={{ color: col.accent, fontSize: "15px", marginBottom: "6px" }}>
                  Abhi koi {SECTIONS.find(s => s.id === activeSection)?.label} nahi hai
                </div>
                <div style={{ color: "#4a5568", fontSize: "12px", fontFamily: "sans-serif" }}>
                  Upar "+ Add" button se naya add karein
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map(item => (
                  <div key={item._id} style={{
                    background: expandedItem === item._id ? col.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${expandedItem === item._id ? col.border : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "12px", overflow: "hidden", animation: "fadeIn 0.3s ease",
                  }}>
                    <div style={{ padding: "14px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={() => setExpandedItem(expandedItem === item._id ? null : item._id)} style={{
                        flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
                      }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: col.accent }}>{item.title}</div>
                        {item.category && (
                          <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "sans-serif", marginTop: "2px" }}>🏷️ {item.category}</div>
                        )}
                        {expandedItem !== item._id && (
                          <div style={{ fontSize: "11px", color: "#4a5568", marginTop: "3px", fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.content.slice(0, 60)}...
                          </div>
                        )}
                      </button>
                      <button onClick={() => startEdit(item)} style={{
                        background: "rgba(212,175,55,0.1)", color: "#d4af37",
                        border: "1px solid rgba(212,175,55,0.3)", borderRadius: "7px",
                        padding: "5px 9px", fontSize: "12px", cursor: "pointer",
                      }}>✏️</button>
                      {deleteId === item._id ? (
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button onClick={() => deleteItem(item._id)} style={{
                            background: "rgba(239,68,68,0.8)", color: "#fff",
                            border: "none", borderRadius: "6px", padding: "5px 8px", fontSize: "11px", cursor: "pointer",
                          }}>Del</button>
                          <button onClick={() => setDeleteId(null)} style={{
                            background: "rgba(255,255,255,0.08)", color: "#aaa",
                            border: "none", borderRadius: "6px", padding: "5px 6px", fontSize: "11px", cursor: "pointer",
                          }}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(item._id)} style={{
                          background: "none", color: "#4a5568", border: "none", fontSize: "15px", cursor: "pointer", padding: "4px",
                        }}>🗑</button>
                      )}
                    </div>
                    {expandedItem === item._id && (
                      <div style={{
                        borderTop: `1px solid ${col.border}`,
                        background: "rgba(0,0,0,0.2)", padding: "14px 16px",
                        animation: "fadeIn 0.2s ease",
                      }}>
                        <div style={{ fontSize: "14px", color: "#e8d5b0", lineHeight: "1.9", whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a5568", fontFamily: "sans-serif" }}>
                          Added: {new Date(item.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 2px; }
        button { touch-action: manipulation; }
      `}</style>
    </div>
  );
}

function Label({ children, color }) {
  return (
    <div style={{ fontSize: "11px", color: color || "#a08040", marginBottom: "5px", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, accent }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", background: "rgba(255,255,255,0.06)",
        border: `1px solid ${accent}44`, borderRadius: "8px",
        padding: "10px 12px", color: "#e8d5b0", fontSize: "16px",
        fontFamily: "sans-serif", outline: "none", marginBottom: "2px",
      }}
    />
  );
}
