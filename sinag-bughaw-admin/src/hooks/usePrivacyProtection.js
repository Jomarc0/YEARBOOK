import { useEffect, useState } from "react";

const FILE_DIALOG_GRACE_MS = 30000;

export function usePrivacyProtection() {
  const [hidden, setHidden] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.hidden || !document.hasFocus();
  });

  useEffect(() => {
    let fileDialogUntil = 0;

    const isFileDialogActive = () => Date.now() < fileDialogUntil;
    const markFileDialogActive = () => {
      fileDialogUntil = Date.now() + FILE_DIALOG_GRACE_MS;
      setHidden(false);
    };
    const clearFileDialogActive = () => {
      fileDialogUntil = 0;
    };

    const hide = () => {
      if (isFileDialogActive()) return;
      setHidden(true);
    };
    const show = () => {
      clearFileDialogActive();
      if (!document.hidden && document.hasFocus()) setHidden(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) hide();
      else show();
    };
    const handleDocumentClick = (event) => {
      if (event.target?.matches?.('input[type="file"]')) {
        markFileDialogActive();
      }
    };
    const handleDocumentChange = (event) => {
      if (event.target?.matches?.('input[type="file"]')) {
        show();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("change", handleDocumentChange, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("change", handleDocumentChange, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", show);
    };
  }, []);

  return hidden;
}
