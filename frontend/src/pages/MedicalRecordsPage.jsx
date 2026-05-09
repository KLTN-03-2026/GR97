import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Download, Plus, Search, X, Sparkles, Calendar, FileText, Filter, Clock, CheckSquare, Square } from "lucide-react";
import { api } from "../lib/api";

const emptyForm = {
  visitDate: dayjs().format("YYYY-MM-DD"),
  hospital: "",
  doctorName: "",
  specialty: "",
  diagnosis: "",
  summary: "",
  symptomsText: "",
  recommendationsText: "",
  prescriptionsText: "",
};

const defaultExportForm = {
  format: "pdf",
  scope: "current",
  specialty: "",
  fromDate: "",
  toDate: "",
  includeSymptoms: true,
  includeRecommendations: true,
  includePrescriptions: true,
};

const normalizeLines = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const parsePrescriptions = (text) =>
  normalizeLines(text).map((line) => {
    const parts = line.split("|").map((item) => item.trim());
    return {
      medicine: parts[0] || "",
      dosage: parts[1] || "",
      usage: parts[2] || "",
    };
  });

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [exportForm, setExportForm] = useState(defaultExportForm);

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/records/me");
      const list = data.records || [];
      setRecords(list);
      setActiveId(list[0]?._id || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const specialties = useMemo(
    () => [...new Set(records.map((item) => item.specialty).filter(Boolean))],
    [records]
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const now = dayjs();

    return records.filter((item) => {
      const matchText =
        !text ||
        item.hospital?.toLowerCase().includes(text) ||
        item.specialty?.toLowerCase().includes(text) ||
        item.diagnosis?.toLowerCase().includes(text) ||
        item.doctorName?.toLowerCase().includes(text);

      const matchSpecialty = !specialtyFilter || item.specialty === specialtyFilter;

      let matchTime = true;
      const visit = dayjs(item.visitDate);
      if (timeFilter === "30d") matchTime = visit.isAfter(now.subtract(30, "day"));
      if (timeFilter === "6m") matchTime = visit.isAfter(now.subtract(6, "month"));
      if (timeFilter === "1y") matchTime = visit.isAfter(now.subtract(1, "year"));

      return matchText && matchSpecialty && matchTime;
    });
  }, [records, query, specialtyFilter, timeFilter]);

  const activeRecord = filtered.find((item) => item._id === activeId) || filtered[0] || null;

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        visitDate: dayjs(form.visitDate).hour(9).minute(0).second(0).millisecond(0).toISOString(),
        hospital: form.hospital.trim(),
        doctorName: form.doctorName.trim(),
        specialty: form.specialty.trim(),
        diagnosis: form.diagnosis.trim(),
        summary: form.summary.trim(),
        symptoms: normalizeLines(form.symptomsText),
        recommendations: normalizeLines(form.recommendationsText),
        prescriptions: parsePrescriptions(form.prescriptionsText).filter(
          (item) => item.medicine && item.dosage && item.usage
        ),
        files: [],
      };

      const { data } = await api.post("/records", payload);
      const record = data.record;
      setRecords((prev) => [record, ...prev]);
      setActiveId(record._id);
      setShowCreateModal(false);
      setForm(emptyForm);
      setMedicationSuggestions([]);
      setNotice("Đã thêm hồ sơ bệnh án mới.");
    } catch (err) {
      setError(err?.response?.data?.message || "Không thêm được hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestMedications = async () => {
    if (!form.symptomsText && !form.diagnosis) {
      setError("Vui lòng nhập triệu chứng hoặc chẩn đoán để được gợi ý thuốc.");
      return;
    }
    setSuggesting(true);
    setError("");
    setMedicationSuggestions([]);
    try {
      // Ưu tiên gọi API mới theo bệnh cụ thể nếu có chẩn đoán
      if (form.diagnosis) {
        const params = new URLSearchParams();
        params.append("disease", form.diagnosis);
        
        try {
          const { data } = await api.get(`/records/drugs-by-disease?${params.toString()}`);
          
          if (data.type === "disease-specific") {
            // Gợi ý theo bệnh cụ thể - hiển thị chi tiết
            const detailedSuggestions = data.medicines.map(med => ({
              medicine: med.name,
              dosage: med.dose,
              usage: `${med.frequency}. ${med.note}`
            }));
            setMedicationSuggestions(detailedSuggestions);
            setNotice(data.advice || `Gợi ý thuốc cho bệnh ${data.disease}`);
            setSuggesting(false);
            return;
          } else if (data.type === "symptom-based" && data.results) {
            // Gợi ý theo triệu chứng
            const allMeds = [];
            data.results.forEach(result => {
              result.medicines.forEach(med => {
                allMeds.push({
                  medicine: med.name,
                  dosage: med.dose,
                  usage: `${med.frequency}. ${med.note}`
                });
              });
            });
            setMedicationSuggestions(allMeds);
            setNotice(data.results[0]?.advice || "Gợi ý thuốc theo triệu chứng");
            setSuggesting(false);
            return;
          }
        } catch (diseaseErr) {
          // Nếu không tìm thấy theo bệnh, thử theo triệu chứng
          console.log("Không tìm thấy theo bệnh, thử theo triệu chứng");
        }
      }
      
      // Fallback: Gọi API cũ theo triệu chứng
      const params = new URLSearchParams();
      if (form.symptomsText) params.append("symptoms", form.symptomsText);
      if (form.diagnosis) params.append("diagnosis", form.diagnosis);
      
      const { data } = await api.get(`/records/medication-suggestions?${params.toString()}`);
      setMedicationSuggestions(data.suggestions || []);
      if (data.suggestions?.length > 0) {
        setNotice(data.message);
      } else {
        // Thử gọi API theo triệu chứng mới
        if (form.symptomsText) {
          const symptomParams = new URLSearchParams();
          symptomParams.append("symptoms", form.symptomsText);
          try {
            const symptomData = await api.get(`/records/drugs-by-symptoms?${symptomParams.toString()}`);
            if (symptomData.data?.results) {
              const allMeds = [];
              symptomData.data.results.forEach(result => {
                result.medicines.forEach(med => {
                  allMeds.push({
                    medicine: med.name,
                    dosage: med.dose,
                    usage: `${med.frequency}. ${med.note}`
                  });
                });
              });
              setMedicationSuggestions(allMeds);
              setNotice(symptomData.data.results[0]?.advice || "Gợi ý thuốc theo triệu chứng");
            }
          } catch (symptomErr) {
            setNotice(data.message || "Chưa có gợi ý thuốc phù hợp.");
          }
        } else {
          setNotice(data.message || "Chưa có gợi ý thuốc phù hợp.");
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Không lấy được gợi ý thuốc.");
    } finally {
      setSuggesting(false);
    }
  };

  const openExportModal = () => {
    setExportForm({
      ...defaultExportForm,
      scope: "current",
      specialty: specialtyFilter,
    });
    setShowExportModal(true);
  };

  const buildExportParams = () => {
    const params = {
      format: exportForm.format,
      includeSymptoms: exportForm.includeSymptoms ? "1" : "0",
      includeRecommendations: exportForm.includeRecommendations ? "1" : "0",
      includePrescriptions: exportForm.includePrescriptions ? "1" : "0",
    };

    if (exportForm.scope === "current") {
      if (timeFilter !== "all") params.timeFilter = timeFilter;
      if (specialtyFilter) params.specialty = specialtyFilter;
    }

    if (exportForm.scope === "custom") {
      if (exportForm.specialty) params.specialty = exportForm.specialty;
      if (exportForm.fromDate) {
        params.fromDate = dayjs(exportForm.fromDate).startOf("day").toISOString();
      }
      if (exportForm.toDate) {
        params.toDate = dayjs(exportForm.toDate).endOf("day").toISOString();
      }
    }

    return params;
  };

   const handleExportSubmit = async (e) => {
    e.preventDefault();
    setExporting(true);
    setError("");
    setNotice("Đang chuẩn bị file, vui lòng chờ...");

    try {
      const params = buildExportParams();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 110000); // Abort sau 110 giây
      
      const response = await api.get("/records/export", {
        params,
        responseType: "blob",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is actually JSON error instead of file
      if (response.data.type === "application/json") {
        const errorText = await response.data.text();
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || "Không xuất được dữ liệu.");
      }
      
       // Determine file extension based on format
       let ext = "json";
       if (params.format === "csv") ext = "csv";
       else if (params.format === "pdf") ext = "pdf";
       else if (params.format === "docx") ext = "docx";
       
       downloadBlob(response.data, `ho-so-benh-an-${dayjs().format("YYYYMMDD-HHmmss")}.${ext}`);
      setShowExportModal(false);
      setNotice("✅ Đã xuất và tải file thành công.");
    } catch (err) {
      // Handle blob error case
      if (err.name === 'AbortError') {
        setError("Quá thời gian chờ. Vui lòng thử lại với ít bản ghi hơn.");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.");
      } else if (err.response && err.response.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorData = JSON.parse(errorText);
          setError(errorData.message || "Không xuất được dữ liệu.");
        } catch {
          setError("Không xuất được dữ liệu. Vui lòng thử lại sau.");
        }
      } else {
        setError(err.message || "Không xuất được dữ liệu.");
      }
      setNotice("");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="records-layout">
      <div className="section-title-row">
        <div>
          <h1>Hồ sơ bệnh án điện tử.</h1>
          <p className="muted">Quản lý và theo dõi lịch sử khám bệnh chi tiết</p>
        </div>
        <div className="row gap-sm">
          <button type="button" className="btn-secondary" onClick={openExportModal}>
            <Download size={16} /> Xuất dữ liệu
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Thêm hồ sơ mới
          </button>
        </div>
      </div>

      {notice ? <p className="success-text">{notice}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="record-filter-row">
        <div className="search-input">
          <Search size={16} />
          <input
            placeholder="Ví dụ: Vinmec, Nội khoa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
          <option value="all">Tất cả thời gian</option>
          <option value="30d">30 ngày gần nhất</option>
          <option value="6m">6 tháng gần nhất</option>
          <option value="1y">1 năm gần nhất</option>
        </select>
        <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
          <option value="">Tất cả chuyên khoa</option>
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>

      <div className="records-content">
        <aside className="record-history">
          <h3>Lịch sử khám gần nhất</h3>
          {loading ? <p className="muted">Đang tải hồ sơ...</p> : null}
          <div className="stack-sm">
            {filtered.map((record) => (
              <button
                type="button"
                key={record._id}
                className={`record-item${activeRecord?._id === record._id ? " active" : ""}`}
                onClick={() => setActiveId(record._id)}
              >
                <small>{dayjs(record.visitDate).format("DD/MM/YYYY")}</small>
                <h4>{record.hospital}</h4>
                <p>{record.doctorName}</p>
                <strong>{record.diagnosis}</strong>
              </button>
            ))}
            {!loading && filtered.length === 0 ? (
              <p className="muted">Không tìm thấy hồ sơ theo bộ lọc hiện tại.</p>
            ) : null}
          </div>
        </aside>

        <article className="record-detail">
          {!activeRecord ? (
            <p className="muted">Không có dữ liệu hồ sơ.</p>
          ) : (
            <>
              <h3>Chi tiết đợt khám: {dayjs(activeRecord.visitDate).format("DD/MM/YYYY")}</h3>
              <div className="record-columns">
                <div>
                  <h4>Triệu chứng lâm sàng</h4>
                  <ul>
                    {(activeRecord.symptoms || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Chẩn đoán & lời dặn</h4>
                  <p>
                    <strong>{activeRecord.summary || activeRecord.diagnosis}</strong>
                  </p>
                  <ul>
                    {(activeRecord.recommendations || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <h4>Kết quả xét nghiệm</h4>
              <div className="record-files">
                {(activeRecord.files || []).length === 0 ? <p className="muted">Chưa có tệp đính kèm.</p> : null}
                {(activeRecord.files || []).map((file) => (
                  <div key={file.name} className="file-card">
                    <p>{file.name}</p>
                    <small>
                      {file.size} - Tải lên: {file.uploadedAtLabel || "--"}
                    </small>
                  </div>
                ))}
              </div>

              <h4>Đơn thuốc</h4>
              <table className="prescription-table">
                <thead>
                  <tr>
                    <th>Tên thuốc</th>
                    <th>Liều dùng</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeRecord.prescriptions || []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted">
                        Không có đơn thuốc.
                      </td>
                    </tr>
                  ) : null}
                  {(activeRecord.prescriptions || []).map((med, index) => (
                    <tr key={`${med.medicine}_${index}`}>
                      <td>{med.medicine}</td>
                      <td>{med.dosage}</td>
                      <td>{med.usage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </article>
      </div>

      {showExportModal ? (
        <div className="modal-backdrop" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
          <form className="export-modal" onSubmit={handleExportSubmit} style={{ 
            maxWidth: "720px", 
            borderRadius: "16px", 
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            overflow: "hidden"
          }}>
            {/* Header */}
            <div style={{ 
              padding: "24px 28px", 
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  background: "#e6f0ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#0052ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="#0052ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="#0052ff" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 17H8" stroke="#0052ff" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 9H9H8" stroke="#0052ff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "26px", fontWeight: "600", color: "#111827" }}>Xuất dữ liệu hồ sơ bệnh án</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#6b7280" }}>Cấu hình định dạng và nội dung cần xuất</p>
                </div>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowExportModal(false)} style={{ padding: "8px", borderRadius: "8px" }}>
                <X size={22} color="#4b5563" />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "28px" }}>
              {/* Format Selection */}
              <div style={{ marginBottom: "32px" }}>
                <label style={{ 
                  display: "block", 
                  fontWeight: "600", 
                  marginBottom: "16px",
                  color: "#374151",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Định dạng tệp tin
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                  {/* DOCX */}
                  <label style={{ 
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    padding: "20px 12px",
                    border: exportForm.format === "docx" ? "2px solid #0052ff" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: exportForm.format === "docx" ? "#e6f0ff" : "white",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value="docx"
                      checked={exportForm.format === "docx"}
                      onChange={(e) => setExportForm((prev) => ({ ...prev, format: e.target.value }))}
                      style={{ display: "none" }}
                    />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill={exportForm.format === "docx" ? "#2563eb" : "#1f2937"} stroke={exportForm.format === "docx" ? "#2563eb" : "#1f2937"} strokeWidth="1.5"/>
                      <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontWeight: "600", color: exportForm.format === "docx" ? "#0052ff" : "#374151", fontSize: "15px" }}>DOCX</span>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Microsoft Word</span>
                  </label>

                  {/* PDF */}
                  <label style={{ 
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    padding: "20px 12px",
                    border: exportForm.format === "pdf" ? "2px solid #0052ff" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: exportForm.format === "pdf" ? "#e6f0ff" : "white",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={exportForm.format === "pdf"}
                      onChange={(e) => setExportForm((prev) => ({ ...prev, format: e.target.value }))}
                      style={{ display: "none" }}
                    />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill={exportForm.format === "pdf" ? "#dc2626" : "#b91c1c"} stroke={exportForm.format === "pdf" ? "#dc2626" : "#b91c1c"} strokeWidth="1.5"/>
                      <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontWeight: "600", color: exportForm.format === "pdf" ? "#0052ff" : "#374151", fontSize: "15px" }}>PDF</span>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Portable Document</span>
                  </label>

                  {/* CSV */}
                  <label style={{ 
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    padding: "20px 12px",
                    border: exportForm.format === "csv" ? "2px solid #0052ff" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: exportForm.format === "csv" ? "#e6f0ff" : "white",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportForm.format === "csv"}
                      onChange={(e) => setExportForm((prev) => ({ ...prev, format: e.target.value }))}
                      style={{ display: "none" }}
                    />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill={exportForm.format === "csv" ? "#059669" : "#047857"} stroke={exportForm.format === "csv" ? "#059669" : "#047857"} strokeWidth="1.5"/>
                      <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontWeight: "600", color: exportForm.format === "csv" ? "#0052ff" : "#374151", fontSize: "15px" }}>CSV</span>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Excel Spreadsheet</span>
                  </label>

                  {/* JSON */}
                  <label style={{ 
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    padding: "20px 12px",
                    border: exportForm.format === "json" ? "2px solid #0052ff" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: exportForm.format === "json" ? "#e6f0ff" : "white",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value="json"
                      checked={exportForm.format === "json"}
                      onChange={(e) => setExportForm((prev) => ({ ...prev, format: e.target.value }))}
                      style={{ display: "none" }}
                    />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill={exportForm.format === "json" ? "#374151" : "#1f2937"} stroke={exportForm.format === "json" ? "#374151" : "#1f2937"} strokeWidth="1.5"/>
                      <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontWeight: "600", color: exportForm.format === "json" ? "#0052ff" : "#374151", fontSize: "15px" }}>JSON</span>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Raw Data</span>
                  </label>
                </div>
              </div>

              {/* Two columns layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "32px" }}>
                {/* Left column - Date Range */}
                <div>
                  <label style={{ 
                    display: "block", 
                    fontWeight: "600", 
                    marginBottom: "16px",
                    color: "#374151",
                    fontSize: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Phạm vi ngày khám
                  </label>
                  
                  <select
                    value={exportForm.scope}
                    onChange={(e) => setExportForm((prev) => ({ ...prev, scope: e.target.value }))}
                    style={{ 
                      padding: "14px 16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "15px",
                      width: "100%",
                      background: "white",
                      marginBottom: "16px"
                    }}
                  >
                    <option value="current">01/01/2024 - Hiện tại</option>
                    <option value="custom">Tùy chọn thủ công</option>
                  </select>

                  {exportForm.scope === "custom" && (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", display: "block" }}>Từ ngày</label>
                        <input
                          type="date"
                          value={exportForm.fromDate}
                          onChange={(e) => setExportForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                          style={{ 
                            padding: "12px 14px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            width: "100%"
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", display: "block" }}>Đến ngày</label>
                        <input
                          type="date"
                          value={exportForm.toDate}
                          onChange={(e) => setExportForm((prev) => ({ ...prev, toDate: e.target.value }))}
                          style={{ 
                            padding: "12px 14px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            width: "100%"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column - Content Options */}
                <div>
                  <label style={{ 
                    display: "block", 
                    fontWeight: "600", 
                    marginBottom: "16px",
                    color: "#374151",
                    fontSize: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Nội dung trích xuất
                  </label>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Symptom toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "15px", color: "#374151" }}>Triệu chứng lâm sàng</span>
                      <button 
                        type="button"
                        onClick={() => setExportForm(p => ({...p, includeSymptoms: !p.includeSymptoms}))}
                        style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
                          border: "none",
                          background: exportForm.includeSymptoms ? "#0052ff" : "#d1d5db",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{
                          position: "absolute",
                          top: "2px",
                          left: exportForm.includeSymptoms ? "22px" : "2px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "10px",
                          background: "white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          transition: "all 0.2s"
                        }} />
                      </button>
                    </div>

                    {/* Recommendation toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "15px", color: "#374151" }}>Khuyến nghị bác sĩ</span>
                      <button 
                        type="button"
                        onClick={() => setExportForm(p => ({...p, includeRecommendations: !p.includeRecommendations}))}
                        style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
                          border: "none",
                          background: exportForm.includeRecommendations ? "#0052ff" : "#d1d5db",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{
                          position: "absolute",
                          top: "2px",
                          left: exportForm.includeRecommendations ? "22px" : "2px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "10px",
                          background: "white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          transition: "all 0.2s"
                        }} />
                      </button>
                    </div>

                    {/* Prescription toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "15px", color: "#374151" }}>Đơn thuốc & Liều dùng</span>
                      <button 
                        type="button"
                        onClick={() => setExportForm(p => ({...p, includePrescriptions: !p.includePrescriptions}))}
                        style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
                          border: "none",
                          background: exportForm.includePrescriptions ? "#0052ff" : "#d1d5db",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{
                          position: "absolute",
                          top: "2px",
                          left: exportForm.includePrescriptions ? "22px" : "2px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "10px",
                          background: "white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          transition: "all 0.2s"
                        }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary info box */}
              <div style={{ 
                background: "#ecfdf5", 
                borderRadius: "12px", 
                padding: "20px",
                border: "1px solid #a7f3d0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#059669"/>
                    <path d="M12 16V12M12 8H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: "14px", color: "#047857", fontWeight: "600" }}>Tóm tắt tệp xuất</span>
                </div>
                <p style={{ fontSize: "14px", color: "#065f46", margin: 0, lineHeight: "1.7" }}>
                  Tệp tin <strong>{exportForm.format.toUpperCase()}</strong> sẽ bao gồm dữ liệu từ <strong>8 bản ghi gần nhất.</strong> Dung lượng ước tính khoảng <strong>2.4 MB.</strong>
                  <br />
                  Mã hóa bảo mật chuẩn HIPAA được áp dụng.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              padding: "20px 28px", 
              background: "#f9fafb",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}>
              <button 
                type="button" 
                onClick={() => setShowExportModal(false)}
                style={{ 
                  padding: "12px 24px", 
                  borderRadius: "8px", 
                  border: "none", 
                  background: "transparent",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer"
                }}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={exporting}
                style={{ 
                  padding: "12px 28px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #0052ff 0%, #003cb3 100%)",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: exporting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(0, 82, 255, 0.3)"
                }}
              >
                {exporting ? (
                  <>
                    <span className="spinner" style={{ width: "16px", height: "16px" }}></span>
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Tải xuống
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
       ) : null}

      {showCreateModal ? (
        <div className="modal-backdrop">
          <form className="record-modal" onSubmit={handleCreateRecord}>
            <div className="section-title-row">
              <h3>Thêm hồ sơ bệnh án mới</h3>
              <button type="button" className="icon-btn" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="record-form-grid">
              <label>Ngày khám</label>
              <input
                type="date"
                value={form.visitDate}
                onChange={(e) => setForm((prev) => ({ ...prev, visitDate: e.target.value }))}
                required
              />
              <label>Bệnh viện</label>
              <input
                value={form.hospital}
                onChange={(e) => setForm((prev) => ({ ...prev, hospital: e.target.value }))}
                required
              />
              <label>Bác sĩ</label>
              <input
                value={form.doctorName}
                onChange={(e) => setForm((prev) => ({ ...prev, doctorName: e.target.value }))}
                required
              />
              <label>Chuyên khoa</label>
              <input
                value={form.specialty}
                onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))}
                required
              />
              <label>Chẩn đoán</label>
              <input
                value={form.diagnosis}
                onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                required
              />
              <label>Tóm tắt</label>
              <textarea
                rows={2}
                value={form.summary}
                onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="Tóm tắt kết luận và tình trạng hiện tại"
              />
              <label>Triệu chứng (mỗi dòng 1 mục)</label>
              <textarea
                rows={3}
                value={form.symptomsText}
                onChange={(e) => setForm((prev) => ({ ...prev, symptomsText: e.target.value }))}
              />
              <label>Lời dặn (mỗi dòng 1 mục)</label>
              <textarea
                rows={3}
                value={form.recommendationsText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, recommendationsText: e.target.value }))
                }
              />
              <label>Đơn thuốc (mỗi dòng theo định dạng: Tên|Liều dùng|Thời gian)</label>
              <textarea
                rows={3}
                value={form.prescriptionsText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, prescriptionsText: e.target.value }))
                }
                placeholder="Paracetamol 500mg|1 viên/lần|Cách 4-6 tiếng"
              />
              
              {/* Medication Suggestions Section */}
              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSuggestMedications}
                  disabled={suggesting}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Sparkles size={16} />
                  {suggesting ? "Đang gợi ý..." : "AI Gợi ý thuốc"}
                </button>
                
                {medicationSuggestions.length > 0 && (
                  <div style={{ marginTop: "12px", padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#166534", fontSize: "14px" }}>💊 Gợi ý thuốc:</h4>
                    <ul style={{ margin: 0, paddingLeft: "16px", color: "#166534", fontSize: "13px" }}>
                      {medicationSuggestions.map((med, idx) => (
                        <li key={idx} style={{ marginBottom: "8px" }}>
                          <strong>{med.medicine}</strong> - {med.dosage}<br />
                          <span style={{ fontSize: "12px" }}>Cách dùng: {med.usage}</span>
                        </li>
                      ))}
                    </ul>
                    <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#15803d", fontStyle: "italic" }}>
                      * Lưu ý: Đây chỉ là gợi ý tham khảo. Vui lòng tham khảo ý kiến bác sĩ trước khi sử dụng.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="row gap-sm">
              <button type="button" className="btn-secondary w-full" onClick={() => setShowCreateModal(false)}>
                Hủy
              </button>
              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? "Đang tạo..." : "Lưu hồ sơ"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
};

export default MedicalRecordsPage;
