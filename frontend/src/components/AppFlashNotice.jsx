import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import NoticeBanner from "./NoticeBanner";
import { consumeFlashNotice } from "../lib/flashNotice";

const AppFlashNotice = () => {
  const location = useLocation();
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const nextNotice = consumeFlashNotice();
    if (nextNotice) {
      setNotice(nextNotice);
    }
  }, [location.key]);

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice) return null;

  return (
    <div className="app-flash-notice">
      <NoticeBanner
        title={notice.title || "Thông báo email"}
        message={notice.message}
        tone={notice.tone || "info"}
        onClose={() => setNotice(null)}
      />
    </div>
  );
};

export default AppFlashNotice;
