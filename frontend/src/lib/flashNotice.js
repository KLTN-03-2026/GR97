const FLASH_NOTICE_KEY = "healthyai_flash_notice";

export const pushFlashNotice = (notice) => {
  if (!notice?.message) return;

  sessionStorage.setItem(
    FLASH_NOTICE_KEY,
    JSON.stringify({
      tone: "info",
      ...notice,
      createdAt: Date.now(),
    })
  );
};

export const consumeFlashNotice = () => {
  const raw = sessionStorage.getItem(FLASH_NOTICE_KEY);
  if (!raw) return null;

  sessionStorage.removeItem(FLASH_NOTICE_KEY);

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
