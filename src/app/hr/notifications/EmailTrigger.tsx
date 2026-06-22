"use client";

import { useEffect } from "react";

// Triggers email sending when admin visits notifications page (fire & forget)
export default function EmailTrigger() {
  useEffect(() => {
    fetch("/api/cron/notify-emails").catch(() => {});
  }, []);
  return null;
}
