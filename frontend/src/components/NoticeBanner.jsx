import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const toneMap = {
  info: {
    icon: Info,
    className: "notice-banner info",
  },
  success: {
    icon: CheckCircle2,
    className: "notice-banner success",
  },
  warning: {
    icon: AlertCircle,
    className: "notice-banner warning",
  },
};

const NoticeBanner = ({
  title = "Thông báo",
  message,
  tone = "info",
  onClose,
  className = "",
}) => {
  if (!message) return null;

  const config = toneMap[tone] || toneMap.info;
  const Icon = config.icon;

  return (
    <div className={`${config.className}${className ? ` ${className}` : ""}`}>
      <div className="notice-banner-icon">
        <Icon size={18} />
      </div>
      <div className="notice-banner-content">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      {onClose ? (
        <button
          type="button"
          className="notice-banner-close"
          onClick={onClose}
          aria-label="Đóng thông báo"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
};

export default NoticeBanner;
