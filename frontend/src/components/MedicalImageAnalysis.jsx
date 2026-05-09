import { useCallback, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Camera,
  CheckCircle,
  ChevronRight,
  FileImage,
  Image as ImageIcon,
  Info,
  Loader2,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Upload,
  X,
} from "lucide-react";
import { api } from "../lib/api";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 640;
const IMAGE_COMPRESSION_QUALITY = 0.55;
const ANALYSIS_TIMEOUT_MS = 25000;
const DEFAULT_DISCLAIMER =
  "Đây chỉ là phân tích sơ bộ từ AI. Hãy tham khảo ý kiến bác sĩ chuyên khoa để được chẩn đoán chính xác và điều trị kịp thời.";
const VALID_URGENCY = new Set(["low", "medium", "high", "critical"]);
const VALID_ACTIONS = new Set(["emergency", "urgent", "consult_doctor", "monitor", "try_later"]);

const IMAGE_TYPES = [
  { value: "xray", label: "X-Quang", description: "Phổi, xương, lồng ngực." },
  { value: "ct_mri", label: "CT/MRI", description: "Cắt lớp, thần kinh, mô mềm." },
  { value: "skin", label: "Da liễu", description: "Tổn thương, phát ban, mụn." },
  { value: "eye", label: "Nhãn khoa", description: "Mắt, võng mạc, giác mạc." },
  { value: "wound", label: "Vết thương", description: "Bỏng, cắt, chấn thương." },
  { value: "ultrasound", label: "Siêu âm", description: "Tim, bụng, thai, mô mềm." },
  { value: "general", label: "Tổng quát", description: "Ảnh y khoa khác." },
];

const URGENCY_CONFIG = {
  low: {
    label: "Thấp",
    description: "Chưa thấy dấu hiệu cần xử trí khẩn.",
    icon: CheckCircle,
  },
  medium: {
    label: "Trung bình",
    description: "Nên theo dõi sát và đối chiếu với triệu chứng.",
    icon: Info,
  },
  high: {
    label: "Cao",
    description: "Cần được bác sĩ đánh giá trong sớm nhất.",
    icon: AlertTriangle,
  },
  critical: {
    label: "Nguy cấp",
    description: "Cần xử trí y tế khẩn cấp ngay.",
    icon: AlertTriangle,
  },
};

const ACTION_LABELS = {
  emergency: "Đi cấp cứu ngay.",
  urgent: "Khám trong 24 giờ.",
  consult_doctor: "Đặt lịch bác sĩ.",
  monitor: "Theo dõi tại nhà.",
  try_later: "Thử lại với ảnh rõ hơn.",
};

const stringifyValue = (value) => {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const toStringArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean);
  const singleValue = stringifyValue(value);
  return singleValue ? [singleValue] : [];
};

const normalizeAnalysisResult = (payload, selectedImageType) => ({
  success: payload?.success !== false,
  imageType: IMAGE_TYPES.some((item) => item.value === payload?.imageType)
    ? payload.imageType
    : selectedImageType,
  imageTypeLabel: stringifyValue(payload?.imageTypeLabel),
  analysis:
    stringifyValue(payload?.analysis) || "Chưa thể trích xuất nội dung phân tích rõ ràng từ AI.",
  warnings: toStringArray(payload?.warnings),
  recommendedAction: VALID_ACTIONS.has(payload?.recommendedAction)
    ? payload.recommendedAction
    : "consult_doctor",
  specialty: stringifyValue(payload?.specialty) || null,
  urgency: VALID_URGENCY.has(payload?.urgency) ? payload.urgency : "medium",
  disclaimer: stringifyValue(payload?.disclaimer) || DEFAULT_DISCLAIMER,
});

const extractHighlights = (analysisText) => {
  if (!analysisText) return [];

  return analysisText
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc file hình ảnh."));
    reader.onload = () => {
      const sourceDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!sourceDataUrl) return reject(new Error("Du lieu hinh anh khong hop le."));

      const img = new window.Image();
      img.onerror = () => {
        const base64 = sourceDataUrl.split(",")[1] || "";
        return base64
          ? resolve({ previewUrl: sourceDataUrl, base64 })
          : reject(new Error("Không thể mở hình ảnh đã tải lên."));
      };
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas khong kha dung.");

          let { width, height } = img;
          if (width > height && width > MAX_IMAGE_DIMENSION) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else if (height > MAX_IMAGE_DIMENSION) {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", IMAGE_COMPRESSION_QUALITY);
          const base64 = compressedDataUrl.split(",")[1] || "";
          if (!base64) throw new Error("Không thể nén hình ảnh.");
          resolve({ previewUrl: compressedDataUrl, base64 });
        } catch {
          const base64 = sourceDataUrl.split(",")[1] || "";
          return base64
            ? resolve({ previewUrl: sourceDataUrl, base64 })
            : reject(new Error("Không thể xử lý hình ảnh."));
        }
      };
      img.src = sourceDataUrl;
    };
    reader.readAsDataURL(file);
  });

export default function MedicalImageAnalysis() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageType, setImageType] = useState("xray");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef(null);

  const selectedType = IMAGE_TYPES.find((type) => type.value === imageType) || IMAGE_TYPES[0];
  const urgency = URGENCY_CONFIG[result?.urgency] || URGENCY_CONFIG.medium;
  const UrgencyIcon = urgency.icon;
  const highlights = extractHighlights(result?.analysis);
  const hasContext = additionalContext.trim().length > 0;
  const canAnalyze = Boolean(image) && !isLoading && !isPreparingImage;

  const processFile = async (file) => {
    if (!file.type.startsWith("image/")) return setError("Vui lòng chọn file hình ảnh.");
    if (file.size > MAX_IMAGE_SIZE_BYTES) return setError("Hinh anh khong duoc vuot qua 10MB.");

    setError(null);
    setResult(null);
    setAnalysisProgress(0);
    setIsPreparingImage(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const processedImage = await compressImage(file);
      setImagePreview(processedImage.previewUrl);
      setImage(processedImage.base64);
    } catch (processingError) {
      console.error("Image processing error:", processingError);
      setImage(null);
      setImagePreview(null);
      setError("Không thể đọc hoặc tối ưu hình ảnh này. Vui lòng thử ảnh khác.");
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") setDragActive(true);
    if (event.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleAnalyze = async () => {
    if (!image) return setError("Vui lòng chọn hình ảnh.");

    setIsLoading(true);
    setError(null);
    setResult(null);
    setAnalysisProgress(0);

    const controller = new AbortController();
    const progressInterval = window.setInterval(() => {
      setAnalysisProgress((previous) =>
        previous >= 90 ? previous : Math.min(previous + Math.random() * 15, 90),
      );
    }, 500);
    const timeoutId = window.setTimeout(() => controller.abort("analysis-timeout"), ANALYSIS_TIMEOUT_MS);

    try {
      const response = await api.post(
        "/chat/analyze-image",
        { image, imageType, additionalContext },
        { signal: controller.signal, timeout: ANALYSIS_TIMEOUT_MS + 5000 },
      );
      setAnalysisProgress(100);
      setResult(normalizeAnalysisResult(response.data, imageType));
    } catch (requestError) {
      if (requestError.code === "ERR_CANCELED") {
        setError("AI đang xử lý quá lâu. Vui lòng thử lại với ảnh nhỏ hơn hoặc thử lại sau ít phút.");
      } else if (requestError.code === "ECONNABORTED") {
        setError("Yêu cầu bị timeout. Vui lòng thử lại hoặc sử dụng ảnh nhỏ hơn.");
      } else if (requestError.response?.status === 429) {
        setError("Server đang bận. Vui lòng chờ vài giây và thử lại.");
      } else {
        setError(requestError.response?.data?.message || "Lỗi khi phân tích hình ảnh. Vui lòng thử lại.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      window.clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setImageType("xray");
    setAdditionalContext("");
    setResult(null);
    setError(null);
    setAnalysisProgress(0);
    setIsPreparingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="analysis-lab">
      <section className="analysis-lab-hero">
        <div className="analysis-lab-hero-copy">
          <div className="analysis-lab-badge">
            <Sparkles size={14} />
            Medical Vision AI
          </div>
          <h1>Phòng phân tích ảnh y khoa chuyên nghiệp.</h1>
          <p>
            Tải ảnh lên, bổ sung bối cảnh lâm sàng và nhận báo cáo AI có cấu trúc rõ ràng
            theo mức độ ưu tiên, cảnh báo và hướng xử trí tiếp theo.
          </p>
          <div className="analysis-lab-hero-chips">
            <span>Nén ảnh tự động.</span>
            <span>Tối ưu cho quy trình nhanh.</span>
            <span>Đọc kết quả theo mức ưu tiên.</span>
          </div>
        </div>

        <div className="analysis-lab-hero-panel">
          <p className="analysis-lab-panel-eyebrow">Session overview</p>
          <div className="analysis-lab-hero-stats">
            <div>
              <span>Loại ảnh</span>
              <strong>{selectedType.label}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>
                {isPreparingImage
                    ? "Đang chuẩn hóa"
                    : imagePreview
                      ? "Sẵn sàng phân tích"
                      : "Chờ dữ liệu"}
              </strong>
            </div>
            <div>
              <span>Bối cảnh</span>
              <strong>{hasContext ? "Đã bổ sung" : "Chưa có"}</strong>
            </div>
            <div>
              <span>Thời gian phản hồi</span>
              <strong>~25 giây tối đa</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="analysis-lab-grid">
        <div className="analysis-lab-main">
          <section className="analysis-lab-card">
            <div className="analysis-lab-card-head">
              <div className="analysis-lab-icon is-teal">
                <Stethoscope size={18} />
              </div>
              <div>
                <p className="analysis-lab-step">Bước 1</p>
                <h2>Chọn nhóm hình ảnh</h2>
                <p className="analysis-lab-subtitle">
                  AI cần biết đúng bối cảnh để phân tích chính xác hơn và trả kết quả đúng phong cách chuyên môn.
                </p>
              </div>
            </div>

            <div className="analysis-lab-type-grid">
              {IMAGE_TYPES.map((type) => {
                const active = imageType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    className={`analysis-lab-type-card${active ? " active" : ""}`}
                    onClick={() => setImageType(type.value)}
                  >
                    <div>
                      <strong>{type.label}</strong>
                      <p>{type.description}</p>
                    </div>
                    <span className={`analysis-lab-type-dot${active ? " active" : ""}`} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="analysis-lab-card">
            <div className="analysis-lab-card-head">
              <div className="analysis-lab-icon is-blue">
                <ImageIcon size={18} />
              </div>
              <div>
                <p className="analysis-lab-step">Bước 2</p>
                <h2>Nạp dữ liệu hình ảnh</h2>
                <p className="analysis-lab-subtitle">
                  Hỗ trợ kéo thả, chọn từ thư viện ảnh hoặc chụp nhanh từ camera. Hệ thống sẽ nén ảnh trước khi gửi đi.
                </p>
              </div>
            </div>

            <div
              className={`analysis-lab-upload${dragActive ? " is-drag" : ""}${imagePreview ? " has-image" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="analysis-lab-preview-shell">
                  <div className="analysis-lab-preview-frame">
                    <img src={imagePreview} alt="Uploaded medical" />
                    <div className="analysis-lab-preview-bar">
                      <span className="analysis-lab-preview-state">
                        {isPreparingImage ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        {isPreparingImage ? "Đang tối ưu ảnh" : "Ảnh đã sẵn sàng"}
                      </span>
                      <span className="analysis-lab-preview-tag">{selectedType.label}</span>
                    </div>
                  </div>

                  <div className="analysis-lab-preview-meta">
                    <div className="analysis-lab-mini-stat">
                      <span>Input</span>
                      <strong>1 ảnh đã nạp.</strong>
                    </div>
                     <div className="analysis-lab-mini-stat">
                       <span>Format</span>
                       <strong>Được nén về JPEG tối ưu.</strong>
                     </div>
                     <div className="analysis-lab-mini-stat">
                       <span>Khuyên nghị</span>
                       <strong>Bổ sung triệu chứng để AI suy luận tốt hơn.</strong>
                     </div>
                    <button type="button" className="analysis-lab-ghost-btn" onClick={handleReset}>
                      <X size={16} />
                      Xóa và tải ảnh khác
                    </button>
                  </div>
                </div>
              ) : (
                <div className="analysis-lab-upload-empty">
                  <div className="analysis-lab-upload-icon">
                    <Upload size={28} />
                  </div>
                  <h3>Kéo thả ảnh vào đây hoặc chọn từ thiết bị.</h3>
                  <p>
                    Hỗ trợ JPG, PNG, WebP tối đa 10MB. Ảnh sẽ được chuẩn hóa để giảm độ trễ và giữ trải nghiệm mượt hơn khi gọi AI.
                  </p>
                  <div className="analysis-lab-upload-actions">
                    <label className="analysis-lab-primary-btn">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        hidden
                      />
                      <Upload size={18} />
                      Chọn từ thư viện ảnh
                    </label>
                    <label className="analysis-lab-secondary-btn">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*"
                        capture="environment"
                        hidden
                      />
                      <Camera size={18} />
                      Chụp ảnh nhanh
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="analysis-lab-card">
            <div className="analysis-lab-card-head">
              <div className="analysis-lab-icon is-amber">
                <Info size={18} />
              </div>
              <div>
                <p className="analysis-lab-step">Bước 3</p>
                <h2>Bổ sung bối cảnh lâm sàng</h2>
                <p className="analysis-lab-subtitle">
                  Càng rõ triệu chứng, mốc thời gian và thuốc đã dùng, báo cáo AI càng dễ đọc và đúng hướng hơn.
                </p>
              </div>
            </div>

            <textarea
              className="analysis-lab-context"
              rows={6}
              value={additionalContext}
              onChange={(event) => setAdditionalContext(event.target.value)}
              placeholder="Ví dụ: Ho 5 ngày, sốt nhẹ, tức ngực bên phải, đã dùng thuốc 2 ngày, cần đối chiếu với ảnh chụp mới nhất..."
            />
          </section>

          {error ? (
            <div className="analysis-lab-alert">
              <AlertTriangle size={18} />
              <div>
                <strong>Không thể hoàn tất phân tích</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          <section className="analysis-lab-action-bar">
            <div className="analysis-lab-action-copy">
              <p className="analysis-lab-panel-eyebrow">Analysis control</p>
              <h3>Sẵn sàng gửi lên AI</h3>
              <p>
                {canAnalyze
                  ? "Dữ liệu đã đầy đủ. Bạn có thể bắt đầu phân tích ngay."
                  : "Hãy chọn ảnh trước, hệ thống sẽ khóa nút phân tích cho đến khi dữ liệu sẵn sàng."}
              </p>
            </div>
            <div className="analysis-lab-action-buttons">
              <button type="button" className="analysis-lab-ghost-btn" onClick={handleReset}>
                <RotateCcw size={18} />
                Đặt lại
              </button>
              <button
                type="button"
                className="analysis-lab-primary-btn"
                disabled={!image || isLoading || isPreparingImage}
                onClick={handleAnalyze}
              >
                {isPreparingImage ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Đang chuẩn bị ảnh
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Đang phân tích
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Phân tích với AI
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        <aside className="analysis-lab-sidebar">
          <section className="analysis-lab-panel is-dark">
            <p className="analysis-lab-panel-eyebrow">Session snapshot</p>
            <div className="analysis-lab-panel-list">
              <div className="analysis-lab-panel-item">
                <span>Loại ảnh đang chọn</span>
                <strong>{selectedType.label}</strong>
              </div>
               <div className="analysis-lab-panel-item">
                 <span>Trạng thái input</span>
                 <strong>
                   {isPreparingImage
                     ? "Đang tối ưu"
                     : imagePreview
                       ? "Sẵn sàng gửi AI"
                       : "Chưa có ảnh"}
                 </strong>
               </div>
               <div className="analysis-lab-panel-item">
                 <span>Bối cảnh lâm sàng</span>
                 <strong>{hasContext ? "Đã bổ sung" : "Chưa có ghi chú"}</strong>
               </div>
               <div className="analysis-lab-panel-item">
                 <span>Mục đích phiên</span>
                 <strong>Screening và triage nhanh.</strong>
               </div>
            </div>
          </section>

          <section className="analysis-lab-panel">
            <div className="analysis-lab-card-head is-compact">
              <div className="analysis-lab-icon is-indigo">
                <Brain size={18} />
              </div>
              <div>
                <p className="analysis-lab-panel-eyebrow">AI report</p>
                <h3>Báo cáo phân tích</h3>
              </div>
            </div>

            {isPreparingImage ? (
              <div className="analysis-lab-state">
                <div className="analysis-lab-state-icon is-processing">
                  <Loader2 size={28} className="spin" />
                </div>
                <h4>Đang chuẩn hóa dữ liệu ảnh</h4>
                <p>Hệ thống đang nén và tối ưu file trước khi gửi sang AI để hạn chế trễ.</p>
              </div>
            ) : isLoading ? (
              <div className="analysis-lab-state">
                <div className="analysis-lab-state-icon is-processing">
                  <Loader2 size={28} className="spin" />
                </div>
                <h4>Đang sinh báo cáo AI</h4>
                <p>AI đang đọc hình, tổng hợp cảnh báo và đề xuất hướng xử trí tiếp theo.</p>
                <div className="analysis-lab-progress">
                  <div className="analysis-lab-progress-head">
                    <span>Tiến trình</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <div className="analysis-lab-progress-bar">
                    <div
                      className="analysis-lab-progress-fill"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="analysis-lab-report">
                <div className="analysis-lab-report-top">
                  <div>
                    <p className="analysis-lab-panel-eyebrow">Executive summary</p>
                    <h4>{result.imageTypeLabel || selectedType.label}</h4>
                  </div>
                  <div className={`analysis-lab-urgency is-${result.urgency}`}>
                    <UrgencyIcon size={16} />
                    <div>
                      <span>Mức ưu tiên</span>
                      <strong>{urgency.label}</strong>
                    </div>
                  </div>
                </div>

                <div className={`analysis-lab-recommendation action-${result.recommendedAction}`}>
                  <span>Hướng xử trí</span>
                  <strong>{ACTION_LABELS[result.recommendedAction] || result.recommendedAction}</strong>
                </div>

                {highlights.length > 0 ? (
                  <div className="analysis-lab-report-block">
                    <h5>Ý chính cần đọc nhanh</h5>
                    <ul className="analysis-lab-bullet-list">
                      {highlights.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="analysis-lab-report-block">
                  <h5>Phân tích chi tiết</h5>
                  <div className="analysis-lab-analysis-text">{result.analysis}</div>
                </div>

                {result.specialty ? (
                  <div className="analysis-lab-report-block">
                    <h5>Chuyên khoa nên ưu tiên</h5>
                    <div className="analysis-lab-specialty-pill">
                      <Stethoscope size={16} />
                      {result.specialty}
                    </div>
                  </div>
                ) : null}

                {result.warnings.length > 0 ? (
                  <div className="analysis-lab-report-block is-warning">
                    <h5>Các điểm cần lưu ý</h5>
                    <ul className="analysis-lab-bullet-list is-warning">
                      {result.warnings.map((warning, index) => (
                        <li key={`${warning}-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="analysis-lab-report-note">
                  <Info size={16} />
                  <p>{result.disclaimer || DEFAULT_DISCLAIMER}</p>
                </div>
              </div>
            ) : (
              <div className="analysis-lab-state is-empty">
                <div className="analysis-lab-state-icon">
                  <FileImage size={28} />
                </div>
                <h4>Chờ báo cáo AI</h4>
                <p>
                  Sau khi tải ảnh và bắt đầu phân tích, báo cáo sẽ xuất hiện tại đây với bố cục rõ ràng để đọc nhanh.
                </p>
              </div>
            )}
          </section>

          <section className="analysis-lab-panel is-note">
            <div className="analysis-lab-note">
              <Activity size={18} />
              <div>
                <strong>Lưu ý chuyên môn</strong>
                <p>{DEFAULT_DISCLAIMER}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
