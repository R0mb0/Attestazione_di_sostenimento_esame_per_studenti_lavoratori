(() => {
  const PDF_FILE = "./Document.pdf";

  const subtitle = document.getElementById("subtitle");
  const themeLabel = document.getElementById("themeLabel");
  const statusPill = document.getElementById("statusPill");

  const pdfFrame = document.getElementById("pdfFrame");
  const overlay = document.getElementById("overlay");
  const fallback = document.getElementById("fallback");
  const fallbackText = document.getElementById("fallbackText");
  const techPre = document.getElementById("techPre");

  const downloadBtn = document.getElementById("downloadBtn");
  const openNewTabBtn = document.getElementById("openNewTabBtn");

  // --- Theme label (auto) ---
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  const setThemeLabel = () => {
    if (!mql) {
      themeLabel.textContent = "auto";
      return;
    }
    themeLabel.textContent = mql.matches ? "scuro (auto)" : "chiaro (auto)";
  };
  setThemeLabel();
  mql?.addEventListener?.("change", setThemeLabel);

  // --- Helpers ---
  const showOverlay = (show) => overlay.toggleAttribute("hidden", !show);

  const setStatus = (text, kind = "neutral") => {
    statusPill.textContent = text;
    // Colori “pill” con bordo in base allo stato
    const map = {
      neutral: "var(--border)",
      ok: "color-mix(in srgb, var(--ok) 55%, var(--border))",
      warn: "color-mix(in srgb, var(--warn) 60%, var(--border))",
      bad: "color-mix(in srgb, var(--bad) 60%, var(--border))",
    };
    statusPill.style.borderColor = map[kind] ?? map.neutral;
  };

  const showFallback = (message, details = "") => {
    fallback.hidden = false;
    pdfFrame.style.visibility = "hidden";
    showOverlay(false);

    fallbackText.textContent = message;
    techPre.textContent = details || "Nessun dettaglio disponibile.";
    setStatus("Anteprima non disponibile", "bad");
    subtitle.textContent = "Errore di visualizzazione";
  };

  // --- Robust check: HEAD request (se servito via HTTP) ---
  const canUseFetch = typeof fetch === "function";

  async function headCheck(url) {
    // Quando apri index.html via file:// molti browser bloccheranno fetch/HEAD verso file://.
    // In quel caso saltiamo la verifica e proviamo direttamente a caricare l'iframe.
    if (!canUseFetch) return { ok: true, note: "fetch non disponibile" };

    const isFileProtocol = location.protocol === "file:";
    if (isFileProtocol) return { ok: true, note: "file:// (verifica HEAD saltata)" };

    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      const ct = res.headers.get("content-type") || "";
      return {
        ok: res.ok,
        status: res.status,
        contentType: ct,
      };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  // --- Init ---
  async function init() {
    subtitle.textContent = "Document.pdf";
    downloadBtn.href = PDF_FILE;
    openNewTabBtn.href = PDF_FILE;

    fallback.hidden = true;
    pdfFrame.style.visibility = "visible";

    showOverlay(true);
    setStatus("Verifica file…", "neutral");

    const check = await headCheck(PDF_FILE);

    if (check.ok === false) {
      showFallback(
        "Non riesco a raggiungere il PDF. Controlla che Document.pdf esista nella stessa cartella e che tu stia servendo la pagina con un server.",
        JSON.stringify(check, null, 2)
      );
      return;
    }

    // Se HEAD ok ma content-type non è pdf, avviso (non blocco).
    if (check.contentType && !check.contentType.includes("pdf")) {
      setStatus("PDF trovato (content-type non standard)", "warn");
    } else {
      setStatus("PDF pronto", "ok");
    }

    // Carica nell'iframe: aggiungo #view=FitH per un fit orizzontale iniziale.
    // (Questo è supportato da molti viewer nativi, ma non tutti. Non è critico.)
    const viewerUrl = `${PDF_FILE}#view=FitH`;
    pdfFrame.src = viewerUrl;

    // Se l’iframe non “load-a” entro un timeout, mostro fallback.
    const TIMEOUT_MS = 9000;
    let settled = false;

    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      showFallback(
        "Timeout nel caricamento dell’anteprima. Il browser potrebbe bloccare l’embed oppure il file è grande/lento.",
        `Timeout ${TIMEOUT_MS}ms\nProtocollo: ${location.protocol}\nURL iframe: ${viewerUrl}\nHEAD: ${JSON.stringify(check, null, 2)}`
      );
    }, TIMEOUT_MS);

    pdfFrame.addEventListener("load", () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      showOverlay(false);
      setStatus("Anteprima caricata", "ok");
      subtitle.textContent = "Anteprima pronta";
    });

    // Nota: error event su iframe non è affidabile cross-browser, quindi il timeout è la parte “solida”.
  }

  init();
})();