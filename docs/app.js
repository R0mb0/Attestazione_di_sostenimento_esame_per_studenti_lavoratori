(() => {
  const PDF_FILE = "./Document.pdf";
  const TIMEOUT_MS = 9000;

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

  const pathLabel = document.getElementById("pathLabel");
  pathLabel.textContent = PDF_FILE;

  // Theme label (auto)
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  const setThemeLabel = () => {
    themeLabel.textContent = mql ? (mql.matches ? "scuro (auto)" : "chiaro (auto)") : "auto";
  };
  setThemeLabel();
  mql?.addEventListener?.("change", setThemeLabel);

  const showOverlay = (show) => overlay.toggleAttribute("hidden", !show);

  const setStatus = (text, kind = "neutral") => {
    statusPill.textContent = text;
    const map = {
      neutral: "var(--border)",
      ok: "color-mix(in srgb, var(--ok) 55%, var(--border))",
      warn: "color-mix(in srgb, var(--warn) 60%, var(--border))",
      bad: "color-mix(in srgb, var(--bad) 60%, var(--border))",
    };
    statusPill.style.borderColor = map[kind] ?? map.neutral;
  };

  const showFallback = (message, details) => {
    fallback.hidden = false;
    showOverlay(false);
    setStatus("Anteprima non disponibile", "bad");
    fallbackText.textContent = message;
    techPre.textContent = details || "—";
  };

  function init() {
    subtitle.textContent = "Document.pdf";
    downloadBtn.href = PDF_FILE;
    openNewTabBtn.href = PDF_FILE;

    fallback.hidden = true;
    setStatus("Caricamento…", "neutral");
    showOverlay(true);

    // Nota: FitH è opzionale; non tutti i viewer lo rispettano.
    const viewerUrl = `${PDF_FILE}#view=FitH`;
    pdfFrame.src = viewerUrl;

    let settled = false;

    const t = window.setTimeout(() => {
      if (settled) return;
      settled = true;

      // Questo è quasi sempre:
      // - file non presente / nome errato / cartella errata (tipico su GitHub Pages)
      // - oppure viewer embed bloccato dal browser
      showFallback(
        "Timeout nel caricamento. Molto probabilmente Document.pdf non è nella stessa cartella pubblicata (oppure il nome non coincide esattamente). Prova 'Apri in nuova scheda': se anche lì è 404 allora è sicuramente path/nome.",
        `Timeout: ${TIMEOUT_MS}ms
Protocollo: ${location.protocol}
Pagina: ${location.href}
Iframe URL: ${viewerUrl}

Controlli:
- Il file esiste su GitHub (nel branch pubblicato)?
- Nome esatto: Document.pdf (maiuscole/minuscole)?
- È nella stessa cartella di index.html (root o /docs a seconda della config Pages)?`
      );
    }, TIMEOUT_MS);

    pdfFrame.addEventListener("load", () => {
      if (settled) return;
      settled = true;
      clearTimeout(t);
      showOverlay(false);
      setStatus("Anteprima caricata", "ok");
    });
  }

  init();
})();