/* ========================================
   ribbon.js
   Cinta de opciones y paneles desplegables
======================================== */

const state = {
  activeTab: null,
  currentDesign: null,
  onDesignChange: null,
};

const FONTS = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Fraunces", value: "'Fraunces', serif" },
  { label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace" },
  { label: "Nunito", value: "'Nunito', sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Courier Prime", value: "'Courier Prime', monospace" },
  { label: "Caveat", value: "'Caveat', cursive" },
  { label: "System", value: "system-ui, sans-serif" },
];

const SCALES = [
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2 },
];

const ALIGNS = [
  { label: "☰ Izq", value: "left" },
  { label: "☰ Centro", value: "center" },
  { label: "☰ Der", value: "right" },
];

/* ---- Helpers DOM ---- */

function el(tag, attrs, children) {
  const node = document.createElement(tag);

  if (attrs) {
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === "className") node.className = val;
      else if (key === "textContent") node.textContent = val;
      else if (key.startsWith("on"))
        node.addEventListener(key.slice(2).toLowerCase(), val);
      else node.setAttribute(key, val);
    });
  }

  if (children) {
    const list = Array.isArray(children) ? children : [children];
    list.forEach((child) => {
      if (typeof child === "string")
        node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    });
  }

  return node;
}

/* ---- Paneles por pestaña ---- */

function buildInicioPanel(design, onDesignChange) {
  /* --- Fuente --- */
  const fontSelect = el("select", { className: "ribbon-select" });
  FONTS.forEach((font) => {
    const opt = el("option", { value: font.value, textContent: font.label });
    if (font.value === design.fontFamily) opt.selected = true;
    fontSelect.appendChild(opt);
  });
  fontSelect.addEventListener("change", () => {
    onDesignChange({ fontFamily: fontSelect.value });
  });

  const fontGroup = el("div", { className: "ribbon-group" }, [
    el("span", { className: "ribbon-label", textContent: "Fuente" }),
    fontSelect,
  ]);

  /* --- Escala --- */
  const scaleButtons = SCALES.map((s) => {
    const isActive = design.scale === s.value;
    const btn = el("button", {
      className: `ribbon-btn${isActive ? " ribbon-btn--active" : ""}`,
      textContent: s.label,
      onClick: () => onDesignChange({ scale: s.value }),
    });
    return btn;
  });

  const scaleGroup = el("div", { className: "ribbon-group" }, [
    el("span", { className: "ribbon-label", textContent: "Escala" }),
    el("div", { className: "ribbon-btn-row" }, scaleButtons),
  ]);

  /* --- Alineación --- */
  const alignButtons = ALIGNS.map((a) => {
    const isActive = (design.textAlign || "left") === a.value;
    return el("button", {
      className: `ribbon-btn${isActive ? " ribbon-btn--active" : ""}`,
      textContent: a.label,
      onClick: () => onDesignChange({ textAlign: a.value }),
    });
  });

  const alignGroup = el("div", { className: "ribbon-group" }, [
    el("span", { className: "ribbon-label", textContent: "Alinear" }),
    el("div", { className: "ribbon-btn-row" }, alignButtons),
  ]);

  const panel = el("div", { className: "ribbon-panel-content" }, [
    fontGroup,
    scaleGroup,
    alignGroup,
  ]);
  return panel;
}

/* ---- Registro de paneles ---- */

const panelBuilders = {
  inicio: buildInicioPanel,
};

/* ---- API principal ---- */

function getPanelEl() {
  return document.querySelector(".ribbon-panel");
}

function clearPanel() {
  const panel = getPanelEl();
  if (panel) {
    panel.innerHTML = "";
    panel.classList.remove("open");
  }
}

function openTab(tabName) {
  const panel = getPanelEl();
  if (!panel) return;

  if (state.activeTab === tabName) {
    closeTab();
    return;
  }

  state.activeTab = tabName;
  panel.innerHTML = "";

  const builder = panelBuilders[tabName];
  if (builder) {
    panel.appendChild(builder(state.currentDesign, state.onDesignChange));
    panel.classList.add("open");
  } else {
    panel.classList.remove("open");
  }

  updateTabStyles();
}

function closeTab() {
  state.activeTab = null;
  clearPanel();
  updateTabStyles();
}

function updateTabStyles() {
  const links = document.querySelectorAll(".ribbon a");
  links.forEach((link) => {
    const tabName = link.dataset.tab;
    link.classList.toggle("active", tabName === state.activeTab);
  });
}

function init(design, onDesignChange) {
  state.currentDesign = design;
  state.onDesignChange = onDesignChange;

  const links = document.querySelectorAll(".ribbon a");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = link.dataset.tab;
      if (tabName) openTab(tabName);
    });
  });
}

function refresh(design, onDesignChange) {
  state.currentDesign = design;
  state.onDesignChange = onDesignChange;

  if (state.activeTab && panelBuilders[state.activeTab]) {
    const panel = getPanelEl();
    if (panel) {
      panel.innerHTML = "";
      panel.appendChild(panelBuilders[state.activeTab](state.currentDesign, state.onDesignChange));
    }
  }
}

export const Ribbon = {
  init,
  openTab,
  closeTab,
  refresh,
};
