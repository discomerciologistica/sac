import { useState, useEffect, useCallback } from "react";

const SCRIPT_URL_KEY = "https://script.google.com/macros/s/AKfycbzbrXpijhmya4FtRKn9f5HC0yOtJpmYUreqNzQxMqjyWPv7nTf892ozqoYTwWgBxLRxeA/exec";

const STATUS_COLORS = {
  "ANDAMENTO": { bg: "#E6F1FB", text: "#185FA5", border: "#378ADD" },
  "AGUARDANDO": { bg: "#FAEEDA", text: "#854F0B", border: "#BA7517" },
  "ENCERRADO": { bg: "#EAF3DE", text: "#3B6D11", border: "#639922" },
  "CANCELADO": { bg: "#FCEBEB", text: "#A32D2D", border: "#E24B4A" },
  "KARENAA": { bg: "#FBEAF0", text: "#993556", border: "#D4537E" },
  "KARENA": { bg: "#FBEAF0", text: "#993556", border: "#D4537E" },
  "DEFAULT": { bg: "#F1EFE8", text: "#5F5E5A", border: "#888780" },
};

const ALL_POSSIBLE_COLUMNS = [
  { key: "ID_OCORRENCIA", label: "ID Ocorrência" },
  { key: "SETOR", label: "Setor" },
  { key: "TIPO", label: "Tipo" },
  { key: "ORDEM_SERVICO", label: "OS" },
  { key: "URGENCIA", label: "Urgência" },
  { key: "DATA_HORA", label: "Data/Hora" },
  { key: "CATEGORIA", label: "Categoria" },
  { key: "STATUS", label: "Status" },
  { key: "DESCRICAO", label: "Descrição" },
  { key: "ATENDENTE", label: "Atendente" },
  { key: "CLIENTE", label: "Cliente" },
  { key: "CONTATO", label: "Contato" },
  { key: "VALOR", label: "Valor" },
  { key: "FABRICANTE", label: "Fabricante" },
  { key: "OK", label: "OK" },
  { key: "SETOR_GESTAO", label: "Setor Gestão" },
  { key: "FABRICANTE_GESTAO", label: "Fabricante Gestão" },
];

const SETORES = ["TI", "Financeiro", "Comercial", "Operações", "RH", "Logística", "Suporte", "Qualidade"];
const FABRICANTES = ["Dell", "HP", "Lenovo", "Apple", "Samsung", "LG", "Intelbras", "Positivo", "Outros"];

const StatusBadge = ({ status }) => {
  const s = status?.toUpperCase() || "";
  const found = Object.keys(STATUS_COLORS).find(k => s.includes(k));
  const colors = STATUS_COLORS[found || "DEFAULT"];
  return (
    <span style={{
      background: colors.bg, color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      whiteSpace: "nowrap", letterSpacing: 0.3
    }}>{status || "—"}</span>
  );
};

const MetricCard = ({ icon, label, value, color }) => (
  <div style={{
    background: "#fff", borderRadius: 14, padding: "16px 20px",
    border: `0.5px solid #e8e8e8`, flex: 1, minWidth: 130,
    borderTop: `3px solid ${color}`, position: "relative", overflow: "hidden"
  }}>
    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: "#888", marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

const MiniBarChart = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", background: color, opacity: 0.15 + (d.value / max) * 0.85,
            borderRadius: "4px 4px 0 0", height: `${(d.value / max) * 100}%`,
            minHeight: 4, transition: "height 0.4s"
          }} />
          <span style={{ fontSize: 9, color: "#999", maxWidth: 40, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function Portal() {
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem(SCRIPT_URL_KEY) || "");
  const [scriptInput, setScriptInput] = useState("");
  const [configured, setConfigured] = useState(!!localStorage.getItem(SCRIPT_URL_KEY));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleCols, setVisibleCols] = useState(["ID_OCORRENCIA","DATA_HORA","STATUS","CATEGORIA","ATENDENTE","CLIENTE","FABRICANTE","OK","SETOR_GESTAO","FABRICANTE_GESTAO"]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("tabela");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = useCallback(async (url) => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${url}?action=getData`, { method: "GET" });
      const json = await res.json();
      if (json.success) {
        setRows(json.data || []);
      } else {
        setError(json.error || "Erro ao carregar dados.");
      }
    } catch (e) {
      setError("Não foi possível conectar ao Apps Script. Verifique a URL.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (configured && scriptUrl) fetchData(scriptUrl);
  }, [configured, scriptUrl, fetchData]);

  const handleConfigure = () => {
    if (!scriptInput.trim()) return;
    localStorage.setItem(SCRIPT_URL_KEY, scriptInput.trim());
    setScriptUrl(scriptInput.trim());
    setConfigured(true);
  };

  const handleEdit = (row) => {
    setEditingRow(row.ID_OCORRENCIA || row._row);
    setEditData({ OK: row.OK || "", SETOR_GESTAO: row.SETOR_GESTAO || "", FABRICANTE_GESTAO: row.FABRICANTE_GESTAO || "", _row: row._row });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({ action: "updateRow", ...editData }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Salvo com sucesso!");
        setTimeout(() => setSuccessMsg(""), 3000);
        setEditingRow(null);
        fetchData(scriptUrl);
      } else {
        setError(json.error || "Erro ao salvar.");
      }
    } catch (e) {
      setError("Erro de conexão ao salvar.");
    }
    setSaving(false);
  };

  const handleQuickOK = async (row) => {
    setSaving(true);
    try {
      const res = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({ action: "updateRow", _row: row._row, OK: "✓", SETOR_GESTAO: row.SETOR_GESTAO || "", FABRICANTE_GESTAO: row.FABRICANTE_GESTAO || "" }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("OK registrado!");
        setTimeout(() => setSuccessMsg(""), 2500);
        fetchData(scriptUrl);
      }
    } catch {}
    setSaving(false);
  };

  const filteredRows = rows.filter(r => {
    const matchStatus = filterStatus === "TODOS" || (r.STATUS || "").toUpperCase().includes(filterStatus);
    const matchSearch = !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const statusCounts = rows.reduce((acc, r) => {
    const s = (r.STATUS || "OUTROS").toUpperCase();
    const key = Object.keys(STATUS_COLORS).find(k => s.includes(k)) || "OUTROS";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const okCount = rows.filter(r => r.OK === "✓" || r.OK === "OK" || r.OK === "ok").length;
  const pendingCount = rows.length - okCount;

  const fabricanteDist = Object.entries(
    rows.reduce((acc, r) => { const f = r.FABRICANTE_GESTAO || r.FABRICANTE || "N/A"; acc[f] = (acc[f] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));

  const setorDist = Object.entries(
    rows.reduce((acc, r) => { const s = r.SETOR_GESTAO || r.SETOR || "N/A"; acc[s] = (acc[s] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));

  const colors = { primary: "#378ADD", success: "#1D9E75", warning: "#BA7517", danger: "#E24B4A", purple: "#534AB7" };

  if (!configured) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0e1a 0%, #1a2540 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 48px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg, #378ADD, #534AB7)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>Portal de Gestão</h1>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 32px", lineHeight: 1.6 }}>Cole a URL do seu Apps Script para conectar ao Google Sheets</p>
          <input
            value={scriptInput}
            onChange={e => setScriptInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 13, marginBottom: 16, boxSizing: "border-box", outline: "none", fontFamily: "monospace" }}
          />
          <button onClick={handleConfigure} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #378ADD, #534AB7)", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Conectar →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d1b3e 0%, #1a2f6b 100%)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>Portal de Gestão</span>
          <span style={{ background: "rgba(255,255,255,0.15)", color: "#adc8f0", fontSize: 11, padding: "3px 10px", borderRadius: 20, marginLeft: 4 }}>GOOGLE SHEETS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {successMsg && <span style={{ background: "#1D9E75", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✓ {successMsg}</span>}
          <button onClick={() => fetchData(scriptUrl)} disabled={loading} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            {loading ? "⟳ Carregando..." : "↻ Atualizar"}
          </button>
          <button onClick={() => { localStorage.removeItem(SCRIPT_URL_KEY); setConfigured(false); setScriptInput(""); }} style={{ background: "rgba(255,100,100,0.15)", color: "#ff9999", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
            Desconectar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", padding: "0 32px", display: "flex", gap: 0 }}>
        {["tabela", "dashboard"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "14px 24px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: tab === t ? 700 : 400,
            color: tab === t ? colors.primary : "#888",
            borderBottom: tab === t ? `2px solid ${colors.primary}` : "2px solid transparent",
            transition: "all 0.2s"
          }}>
            {t === "tabela" ? "📋 Tabela de Dados" : "📊 Dashboard"}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 32px" }}>
        {error && <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#A32D2D", fontSize: 13 }}>⚠ {error}</div>}

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div>
            {/* Metric Cards */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <MetricCard icon="📁" label="Total de Registros" value={rows.length} color={colors.primary} />
              <MetricCard icon="✅" label="Com OK" value={okCount} color={colors.success} />
              <MetricCard icon="⏳" label="Pendentes" value={pendingCount} color={colors.warning} />
              <MetricCard icon="🔴" label="Andamento" value={statusCounts["ANDAMENTO"] || 0} color={colors.danger} />
              <MetricCard icon="✔" label="Encerrados" value={statusCounts["ENCERRADO"] || 0} color={colors.success} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Status Pie */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "0.5px solid #e8e8e8" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 16 }}>Status por Categoria</div>
                {Object.entries(statusCounts).map(([k, v]) => {
                  const total = rows.length || 1;
                  const pct = Math.round((v / total) * 100);
                  const col = STATUS_COLORS[k] || STATUS_COLORS.DEFAULT;
                  return (
                    <div key={k} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: col.text, fontWeight: 600 }}>{k}</span>
                        <span style={{ color: "#888" }}>{v} ({pct}%)</span>
                      </div>
                      <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${pct}%`, background: col.border, borderRadius: 4, height: 6, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fabricantes */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "0.5px solid #e8e8e8" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 16 }}>Por Fabricante</div>
                <MiniBarChart data={fabricanteDist} color={colors.purple} />
                <div style={{ marginTop: 12 }}>
                  {fabricanteDist.map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: "0.5px solid #f0f0f0" }}>
                      <span style={{ color: "#555" }}>{d.label}</span>
                      <span style={{ fontWeight: 600, color: colors.purple }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Setores */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "0.5px solid #e8e8e8" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 16 }}>Por Setor</div>
                <MiniBarChart data={setorDist} color={colors.success} />
                <div style={{ marginTop: 12 }}>
                  {setorDist.map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: "0.5px solid #f0f0f0" }}>
                      <span style={{ color: "#555" }}>{d.label}</span>
                      <span style={{ fontWeight: 600, color: colors.success }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* OK Progress */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "0.5px solid #e8e8e8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>Progresso de OK</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.success }}>{rows.length > 0 ? Math.round((okCount / rows.length) * 100) : 0}%</span>
              </div>
              <div style={{ background: "#f0f0f0", borderRadius: 8, height: 12 }}>
                <div style={{ width: `${rows.length > 0 ? (okCount / rows.length) * 100 : 0}%`, background: `linear-gradient(90deg, ${colors.success}, #5DCAA5)`, borderRadius: 8, height: 12, transition: "width 0.8s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginTop: 6 }}>
                <span>{okCount} aprovados</span><span>{pendingCount} pendentes</span>
              </div>
            </div>
          </div>
        )}

        {/* TABELA TAB */}
        {tab === "tabela" && (
          <div>
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Buscar..."
                style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 13, width: 220, outline: "none" }}
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 13, background: "#fff", cursor: "pointer" }}>
                <option value="TODOS">Todos os status</option>
                {Object.keys(STATUS_COLORS).filter(k => k !== "DEFAULT").map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <div style={{ position: "relative", marginLeft: "auto" }}>
                <button onClick={() => setColPickerOpen(!colPickerOpen)} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  ⚙ Colunas <span style={{ background: colors.primary, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{visibleCols.length}</span>
                </button>
                {colPickerOpen && (
                  <div style={{ position: "absolute", right: 0, top: 44, background: "#fff", borderRadius: 12, border: "1px solid #e0e0e0", padding: 16, zIndex: 100, width: 260, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 10 }}>ESCOLHER COLUNAS</div>
                    {ALL_POSSIBLE_COLUMNS.map(col => (
                      <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer", fontSize: 13 }}>
                        <input type="checkbox" checked={visibleCols.includes(col.key)} onChange={e => {
                          if (e.target.checked) setVisibleCols(v => [...v, col.key]);
                          else setVisibleCols(v => v.filter(c => c !== col.key));
                        }} />
                        {col.label}
                      </label>
                    ))}
                    <button onClick={() => setColPickerOpen(false)} style={{ width: "100%", marginTop: 10, padding: "8px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Aplicar</button>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 12, color: "#888" }}>{filteredRows.length} registros</span>
            </div>

            {/* Table */}
            <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e8e8e8", overflow: "auto" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
                  <div>Carregando dados...</div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 14 }}>Nenhum registro encontrado</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>Cole dados na Aba 1 do Google Sheets e clique em Atualizar</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8f9ff", borderBottom: "1px solid #e8e8e8" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#555", whiteSpace: "nowrap", fontSize: 11 }}>AÇÕES</th>
                      {ALL_POSSIBLE_COLUMNS.filter(c => visibleCols.includes(c.key)).map(col => (
                        <th key={col.key} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#555", whiteSpace: "nowrap", fontSize: 11 }}>{col.label.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, i) => {
                      const isEditing = editingRow === (row.ID_OCORRENCIA || row._row);
                      return (
                        <tr key={i} style={{ borderBottom: "0.5px solid #f0f0f0", background: isEditing ? "#f0f7ff" : i % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.2s" }}>
                          <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <label style={{ fontSize: 10, color: "#888", width: 60 }}>OK:</label>
                                  <select value={editData.OK} onChange={e => setEditData(d => ({ ...d, OK: e.target.value }))} style={{ flex: 1, padding: "4px 6px", borderRadius: 6, border: "1px solid #ddd", fontSize: 11 }}>
                                    <option value="">—</option><option value="✓">✓ OK</option><option value="Revisar">Revisar</option>
                                  </select>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <label style={{ fontSize: 10, color: "#888", width: 60 }}>Setor:</label>
                                  <select value={editData.SETOR_GESTAO} onChange={e => setEditData(d => ({ ...d, SETOR_GESTAO: e.target.value }))} style={{ flex: 1, padding: "4px 6px", borderRadius: 6, border: "1px solid #ddd", fontSize: 11 }}>
                                    <option value="">—</option>
                                    {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <label style={{ fontSize: 10, color: "#888", width: 60 }}>Fabric.:</label>
                                  <select value={editData.FABRICANTE_GESTAO} onChange={e => setEditData(d => ({ ...d, FABRICANTE_GESTAO: e.target.value }))} style={{ flex: 1, padding: "4px 6px", borderRadius: 6, border: "1px solid #ddd", fontSize: 11 }}>
                                    <option value="">—</option>
                                    {FABRICANTES.map(f => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "5px", background: colors.success, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                                    {saving ? "..." : "✓ Salvar"}
                                  </button>
                                  <button onClick={() => setEditingRow(null)} style={{ flex: 1, padding: "5px", background: "#f0f0f0", color: "#666", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => handleQuickOK(row)} title="Marcar OK" style={{ padding: "4px 8px", background: row.OK === "✓" ? "#EAF3DE" : "#f0f0f0", color: row.OK === "✓" ? "#3B6D11" : "#666", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                                  {row.OK === "✓" ? "✓" : "OK"}
                                </button>
                                <button onClick={() => handleEdit(row)} title="Editar" style={{ padding: "4px 8px", background: "#E6F1FB", color: colors.primary, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✎</button>
                              </div>
                            )}
                          </td>
                          {ALL_POSSIBLE_COLUMNS.filter(c => visibleCols.includes(c.key)).map(col => (
                            <td key={col.key} style={{ padding: "8px 12px", color: "#333", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {col.key === "STATUS" ? <StatusBadge status={row[col.key]} /> : (row[col.key] || "—")}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
