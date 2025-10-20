// Lightweight helper to mount/unmount CoreUI CSS only when admin views are active

const COREUI_LINK_ID = "coreui-css-cdn";
const COREUI_CSS_HREF = "https://cdn.jsdelivr.net/npm/@coreui/coreui@5.1.0/dist/css/coreui.min.css";

export function mountCoreUiCss() {
  const currentUsers = Number(window.__coreuiCssUsers || 0);
  window.__coreuiCssUsers = currentUsers + 1;
  
  if (!document.getElementById(COREUI_LINK_ID)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = COREUI_LINK_ID;
    link.href = COREUI_CSS_HREF;
    
    // Thêm fallback CSS nếu CDN fail
    link.onerror = () => {
      console.warn("CoreUI CSS CDN failed, using fallback");
      const fallbackStyle = document.createElement("style");
      fallbackStyle.id = "coreui-fallback";
      fallbackStyle.textContent = `
        .d-flex { display: flex !important; }
        .flex-column { flex-direction: column !important; }
        .min-vh-100 { min-height: 100vh !important; }
        .w-100 { width: 100% !important; }
        .flex-grow-1 { flex-grow: 1 !important; }
        .py-3 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
        .bg-body-tertiary { background-color: #f8f9fa !important; }
        .wrapper { position: relative; }
        .body { flex: 1; }
      `;
      document.head.appendChild(fallbackStyle);
    };
    
    document.head.appendChild(link);
  }
}

export function unmountCoreUiCss() {
  const currentUsers = Number(window.__coreuiCssUsers || 0) - 1;
  window.__coreuiCssUsers = Math.max(0, currentUsers);
  if (window.__coreuiCssUsers === 0) {
    const link = document.getElementById(COREUI_LINK_ID);
    if (link) link.remove();
  }
}


