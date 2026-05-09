import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const formatAmount = (amount) => {
  const numericAmount = Number(amount) || 0;
  return `${numericAmount.toLocaleString("vi-VN")} đ`;
};

const formatSchedule = (appointmentAt, slotLabel) => {
  if (!appointmentAt) return slotLabel || "Chưa cập nhật";

  const dateLabel = dayjs(appointmentAt).format("DD/MM/YYYY");
  const timeLabel = slotLabel || dayjs(appointmentAt).format("HH:mm");
  return `${timeLabel} - ${dateLabel}`;
};

const QRPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const bookingCode = searchParams.get("bookingCode");

  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("success");

  useEffect(() => {
    const loadPaymentDetails = async () => {
      if (!bookingCode) {
        setError("Không tìm thấy mã đặt lịch.");
        setLoading(false);
        return;
      }

      try {
        const [paymentRes, bookingRes] = await Promise.all([
          api.post("/payment/create", {
            bookingCode,
            paymentMethod: "vnpay_qr",
          }),
          api.get(`/payment/info/${bookingCode}`),
        ]);

        setPaymentData(paymentRes.data);
        setBookingInfo(bookingRes.data);
        setStatusMessage("");
        setStatusTone("success");
      } catch (err) {
        console.error("Failed to load payment details:", err);
        setError(err?.response?.data?.message || "Không thể tải thông tin thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    loadPaymentDetails();
  }, [bookingCode]);

  const invoiceRows = useMemo(() => {
    const serviceTitle = bookingInfo?.serviceTitle || "Khám tổng quát";
    const amount = Number(bookingInfo?.amount) || 0;

    return [
      {
        id: "service",
        name: serviceTitle,
        quantity: 1,
        unitPrice: amount,
      },
      {
        id: "support",
        name: "Phí xử lý lịch hẹn",
        quantity: 1,
        unitPrice: 0,
      },
    ];
  }, [bookingInfo]);

  const subtotal = invoiceRows.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.unitPrice),
    0
  );

  const copyBookingCode = async () => {
    if (!bookingInfo?.bookingCode) return;

    try {
      await navigator.clipboard.writeText(bookingInfo.bookingCode);
      setStatusMessage("Đã sao chép mã đặt lịch.");
      setStatusTone("success");
    } catch {
      setStatusMessage("Không thể sao chép mã đặt lịch trên trình duyệt này.");
      setStatusTone("warning");
    }
  };

  const openVnpayGateway = () => {
    if (paymentData?.paymentUrl) {
      window.open(paymentData.paymentUrl, "_blank", "noopener,noreferrer");
    }
  };

  const checkPaymentStatus = async () => {
    if (!bookingCode) return;

    setCheckingStatus(true);
    setStatusMessage("");
    setStatusTone("success");

    try {
      const { data } = await api.get(`/payment/status/${bookingCode}`);

      if (data.paymentStatus === "paid") {
        navigate(`/payment-result?success=true&bookingCode=${bookingCode}`);
        return;
      }

      setStatusMessage("Hệ thống chưa ghi nhận giao dịch. Vui lòng quét QR và thử lại.");
      setStatusTone("warning");
    } catch (err) {
      console.error("Failed to check payment status:", err);
      setStatusMessage("Không thể kiểm tra trạng thái thanh toán lúc này.");
      setStatusTone("warning");
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <section className="qr-payment-shell">
        <div className="qr-payment-loading">
          <div className="qr-loader" />
          <p>Đang tạo mã QR thanh toán...</p>
        </div>
        <style>{styles}</style>
      </section>
    );
  }

  if (error) {
    return (
      <section className="qr-payment-shell">
        <div className="qr-payment-error">
          <AlertCircle size={42} />
          <h1>Không thể tạo trang thanh toán</h1>
          <p>{error}</p>
          <button type="button" className="qr-primary-btn" onClick={() => navigate(-1)}>
            Quay lai
          </button>
        </div>
        <style>{styles}</style>
      </section>
    );
  }

  return (
    <section className="qr-payment-shell">
      <div className="qr-payment-page">
        <header className="qr-payment-header">
          <button type="button" className="qr-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </button>

          <div className="qr-header-copy">
            <p className="qr-eyebrow">VNPay QR Checkout</p>
            <h1>Thanh toán lịch khám bằng mã QR</h1>
            <span>Quét mã hoặc mở cổng VNPay để thanh toán ngay.</span>
          </div>

          <div className="qr-status-pill">
            <ShieldCheck size={16} />
            <span>Kết nối bảo mật</span>
          </div>
        </header>

        <div className="qr-payment-board">
          <div className="qr-invoice-card">
            <div className="qr-invoice-top">
              <div>
                <p className="qr-eyebrow">Phieu thanh toan</p>
                <h2>{bookingInfo?.bookingCode || bookingCode}</h2>
              </div>
              <div className="qr-brand-mark">
                <span className="qr-brand-vn">VN</span>
                <span className="qr-brand-pay">PAY</span>
              </div>
            </div>

            <div className="qr-invoice-meta">
              <div>
                <span>Benh nhan</span>
                <strong>{user?.fullName || "Khách hàng"}</strong>
              </div>
              <div>
                <span>Lịch khám</span>
                <strong>{formatSchedule(bookingInfo?.appointmentAt, bookingInfo?.slotLabel)}</strong>
              </div>
              <div>
                <span>Bác sĩ / Nơi khám</span>
                <strong>{bookingInfo?.doctorName || bookingInfo?.hospital || "Đang cập nhật"}</strong>
              </div>
            </div>

            <div className="qr-invoice-table">
              <div className="qr-table-head">
                <span>Dịch vụ</span>
                <span>SL</span>
                <span>Đơn giá</span>
                <span>Thành tiền</span>
              </div>

              {invoiceRows.map((item) => (
                <div className="qr-table-row" key={item.id}>
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>{formatAmount(item.unitPrice)}</span>
                  <span>{formatAmount(item.quantity * item.unitPrice)}</span>
                </div>
              ))}
            </div>

            <div className="qr-invoice-footer">
              <div className="qr-email-note">
                <Mail size={16} />
                <span>
                  Bệnh nhân có thể truy cập email của mình để xem thông báo gửi về email.
                </span>
              </div>

              <div className="qr-summary">
                <div>
                  <span>Tạm tính</span>
                  <strong>{formatAmount(subtotal)}</strong>
                </div>
                <div>
                  <span>Giảm giá</span>
                  <strong>0 đ</strong>
                </div>
                <div className="total">
                  <span>Tổng cộng</span>
                  <strong>{formatAmount(bookingInfo?.amount)}</strong>
                </div>
              </div>
            </div>
          </div>

          <aside className="qr-scan-card">
            <div className="qr-scan-top">
              <div>
                <p className="qr-eyebrow">VietQR / VNPay</p>
                <h3>Quét mã để thanh toán</h3>
              </div>
              <div className="qr-badges">
                <span>Scan</span>
                <span>Pay</span>
              </div>
            </div>

            <div className="qr-code-frame">
              {paymentData?.qrImageUrl ? (
                <img
                  src={paymentData.qrImageUrl}
                  alt="Mã QR thanh toán VNPay"
                  className="qr-code-image"
                />
              ) : (
                <div className="qr-code-placeholder">Đang tải QR...</div>
              )}
            </div>

            <div className="qr-amount-box">
              <span>Số tiền thanh toán</span>
              <strong>{formatAmount(bookingInfo?.amount)}</strong>
            </div>

            <div className="qr-guide-list">
              <div>
                <Smartphone size={16} />
                <span>Mở ứng dụng ngân hàng hoặc ví VNPay và chọn quét QR.</span>
              </div>
              <div>
                <CreditCard size={16} />
                <span>Quét trọn khung mã, không zoom và không thêm bộ lọc hình ảnh.</span>
              </div>
              <div>
                <CheckCircle2 size={16} />
                <span>Sau khi xác nhận giao dịch, bấm kiểm tra trạng thái để cập nhật.</span>
              </div>
            </div>

            <div className="qr-actions">
              <button
                type="button"
                className="qr-primary-btn"
                onClick={openVnpayGateway}
                disabled={!paymentData?.paymentUrl}
              >
                Mở cổng VNPay
              </button>

              <button
                type="button"
                className="qr-secondary-btn"
                onClick={checkPaymentStatus}
                disabled={checkingStatus}
              >
                {checkingStatus ? "Đang kiểm tra..." : "Kiểm tra trạng thái"}
              </button>
            </div>

            <div className="qr-card-footer">
              <button type="button" className="qr-inline-copy" onClick={copyBookingCode}>
                <Copy size={14} />
                <span>Sao chép mã đặt lịch</span>
              </button>
              <span>QR có hiệu lực trong 15 phút.</span>
            </div>
          </aside>
        </div>

        {paymentData?.note ? (
          <div className="qr-helper-note">
            <AlertCircle size={16} />
            <span>{paymentData.note}</span>
          </div>
        ) : null}

        {statusMessage ? (
          <div className={`qr-helper-note${statusTone === "success" ? " success" : ""}`}>
            {statusTone === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage}</span>
          </div>
        ) : null}
      </div>

      <style>{styles}</style>
    </section>
  );
};

const styles = `
  .qr-payment-shell {
    min-height: 100vh;
    padding: 24px;
    background:
      radial-gradient(circle at top left, rgba(39, 128, 222, 0.16), transparent 28%),
      linear-gradient(180deg, #eef4fb 0%, #f7f9fc 45%, #eef2f7 100%);
  }

  .qr-payment-page {
    width: min(1120px, 100%);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .qr-payment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 22px;
    border: 1px solid rgba(144, 164, 183, 0.22);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(14px);
  }

  .qr-back-btn,
  .qr-inline-copy {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    color: #35506f;
    font-weight: 700;
  }

  .qr-header-copy {
    flex: 1;
  }

  .qr-header-copy h1 {
    margin: 6px 0;
    font-size: clamp(26px, 3vw, 38px);
    color: #112036;
    letter-spacing: -0.03em;
  }

  .qr-header-copy span {
    color: #61778f;
    font-size: 14px;
  }

  .qr-eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2a78ca;
  }

  .qr-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 999px;
    background: #eaf5ee;
    color: #127549;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  .qr-payment-board {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
    gap: 20px;
  }

  .qr-invoice-card,
  .qr-scan-card {
    border-radius: 28px;
    border: 1px solid rgba(166, 181, 201, 0.22);
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.1);
  }

  .qr-invoice-card {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .qr-invoice-top,
  .qr-scan-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .qr-invoice-top h2,
  .qr-scan-top h3 {
    margin: 8px 0 0;
    font-size: 24px;
    color: #13233a;
  }

  .qr-brand-mark {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 10px 14px;
    border-radius: 999px;
    background: linear-gradient(90deg, #e9f3ff 0%, #fff1e7 100%);
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .qr-brand-vn {
    color: #e03131;
  }

  .qr-brand-pay {
    color: #1c7ed6;
  }

  .qr-invoice-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .qr-invoice-meta div {
    padding: 14px 16px;
    border-radius: 18px;
    background: #f6f9fd;
    border: 1px solid #e2eaf3;
  }

  .qr-invoice-meta span,
  .qr-summary span,
  .qr-amount-box span {
    display: block;
    margin-bottom: 6px;
    color: #7286a0;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .qr-invoice-meta strong,
  .qr-summary strong {
    color: #102136;
    font-size: 15px;
    line-height: 1.5;
  }

  .qr-invoice-table {
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid #e3ebf4;
  }

  .qr-table-head,
  .qr-table-row {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) 70px 140px 140px;
    gap: 12px;
    padding: 16px 18px;
    align-items: center;
  }

  .qr-table-head {
    background: #eff5fb;
    color: #6c849d;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .qr-table-row {
    background: #fff;
    border-top: 1px solid #edf2f8;
    color: #1a2b43;
    font-size: 14px;
  }

  .qr-invoice-footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 18px;
    align-items: start;
  }

  .qr-email-note {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 18px;
    border-radius: 20px;
    background: linear-gradient(135deg, #f2f8ff 0%, #eefbf3 100%);
    border: 1px solid #dbe9f7;
    color: #314b68;
    font-size: 14px;
    line-height: 1.6;
  }

  .qr-summary {
    padding: 18px;
    border-radius: 22px;
    background: #f8fbff;
    border: 1px solid #dfe8f3;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .qr-summary .total {
    padding-top: 14px;
    border-top: 1px solid #dbe5ef;
  }

  .qr-summary .total strong {
    font-size: 24px;
    color: #0d63bd;
  }

  .qr-scan-card {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(39, 128, 222, 0.14), transparent 36%),
      rgba(255, 255, 255, 0.96);
  }

  .qr-badges {
    display: inline-flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .qr-badges span {
    padding: 6px 10px;
    border-radius: 999px;
    background: #e8f2fd;
    color: #236ebd;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .qr-code-frame {
    display: grid;
    place-items: center;
    padding: 18px;
    border-radius: 26px;
    background: linear-gradient(180deg, #ffffff 0%, #f5f8fc 100%);
    border: 1px solid #dce6f1;
  }

  .qr-code-image {
    display: block;
    width: min(100%, 320px);
    aspect-ratio: 1 / 1;
    object-fit: contain;
    padding: 14px;
    border-radius: 20px;
    background: #fff;
    image-rendering: crisp-edges;
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
  }

  .qr-code-placeholder {
    min-height: 320px;
    width: 100%;
    display: grid;
    place-items: center;
    color: #6c8198;
    font-weight: 700;
  }

  .qr-amount-box {
    padding: 16px 18px;
    border-radius: 18px;
    background: #14253c;
    color: #fff;
  }

  .qr-amount-box strong {
    font-size: 28px;
    letter-spacing: -0.03em;
  }

  .qr-amount-box span {
    color: rgba(255, 255, 255, 0.72);
  }

  .qr-guide-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .qr-guide-list div {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 14px 16px;
    border-radius: 18px;
    background: #f5f9fe;
    border: 1px solid #e0e9f3;
    color: #415972;
    font-size: 14px;
    line-height: 1.5;
  }

  .qr-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .qr-primary-btn,
  .qr-secondary-btn {
    min-height: 50px;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 800;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .qr-primary-btn {
    background: linear-gradient(135deg, #2780de, #1353a8);
    color: #fff;
    box-shadow: 0 16px 30px rgba(39, 128, 222, 0.28);
  }

  .qr-secondary-btn {
    border: 1px solid #cbd8e7;
    background: #fff;
    color: #1f5ea2;
  }

  .qr-primary-btn:hover:not(:disabled),
  .qr-secondary-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .qr-primary-btn:disabled,
  .qr-secondary-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .qr-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #6c8198;
    font-size: 13px;
  }

  .qr-helper-note {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid #f0d6a3;
    background: #fff7e6;
    color: #996500;
    font-size: 14px;
  }

  .qr-helper-note.success {
    border-color: #b8e2c4;
    background: #edf9f0;
    color: #157347;
  }

  .qr-payment-loading,
  .qr-payment-error {
    width: min(460px, 100%);
    margin: 72px auto 0;
    padding: 36px;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(166, 181, 201, 0.22);
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.1);
    text-align: center;
  }

  .qr-payment-loading p,
  .qr-payment-error p {
    margin: 12px 0 0;
    color: #637a94;
    line-height: 1.6;
  }

  .qr-payment-error h1 {
    margin: 16px 0 0;
    font-size: 28px;
    color: #14253c;
  }

  .qr-loader {
    width: 48px;
    height: 48px;
    margin: 0 auto;
    border-radius: 999px;
    border: 4px solid rgba(39, 128, 222, 0.18);
    border-top-color: #2780de;
    animation: qr-spin 1s linear infinite;
  }

  @keyframes qr-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 980px) {
    .qr-payment-shell {
      padding: 18px;
    }

    .qr-payment-header,
    .qr-payment-board,
    .qr-invoice-meta,
    .qr-invoice-footer {
      grid-template-columns: 1fr;
    }

    .qr-payment-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .qr-payment-board {
      display: flex;
      flex-direction: column;
    }

    .qr-status-pill {
      white-space: normal;
    }
  }

  @media (max-width: 720px) {
    .qr-invoice-card,
    .qr-scan-card {
      padding: 18px;
      border-radius: 22px;
    }

    .qr-table-head,
    .qr-table-row {
      grid-template-columns: minmax(0, 1.4fr) 44px 96px 96px;
      padding: 14px 12px;
      gap: 10px;
      font-size: 12px;
    }

    .qr-card-footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

export default QRPaymentPage;
