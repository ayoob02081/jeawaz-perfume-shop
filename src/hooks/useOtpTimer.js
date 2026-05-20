import { useEffect, useState } from "react";

export default function useOtpTimer() {
  const [expiresAt, setExpiresAt] = useState(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("otp_expires_at");
    if (saved) {
      setExpiresAt(Number(saved));
    }
  }, []);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

      setRemaining(diff);

      if (diff === 0) {
        clearInterval(interval);
        localStorage.removeItem("otp_expires_at");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const startTimer = (timestamp) => {
    localStorage.setItem("otp_expires_at", timestamp);
    setExpiresAt(timestamp); // ✅ این باعث فعال شدن useEffect دوم میشه
  };

  return { remaining, startTimer };
}
