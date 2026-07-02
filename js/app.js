import { Editor } from "./editor.js";
import { Slides } from "./slides.js";
import { Exporter } from "./exporter.js";
import { Ribbon } from "./ribbon.js";

let design = {
  fontFamily: "'Inter', sans-serif",
  scale: 1,
  textAlign: "left",
};

function applyDesign() {
  const stage = document.querySelector(".stage");
  if (!stage) return;
  stage.style.setProperty("--slide-scale", design.scale);
  stage.style.setProperty("--slide-font", design.fontFamily);
  stage.style.setProperty("--slide-align", design.textAlign);
}

function onDesignChange(newDesign) {
  design = { ...newDesign };
  applyDesign();
  Ribbon.refresh(design, onDesignChange);
}

function generate() {
  const md = Editor.getValue();
  Slides.render(md);
}

function exportHtml() {
  const items = Slides.getItems();
  if (!items.length) generate();
  Exporter.download(Slides.getItems(), design);
}

function init() {
  Editor.init();

  Ribbon.init(design, onDesignChange);

  const btnExport = document.getElementById("btnExportHtml");
  const btnNew = document.getElementById("btnNew");
  const btnToggleEditor = document.getElementById("btnToggleEditor");
  const btnCloseEditor = document.getElementById("btnCloseEditor");

  if (btnExport) btnExport.addEventListener("click", exportHtml);
  if (btnNew)
    btnNew.addEventListener("click", () => {
      Editor.setValue(Editor.defaultContent);
      generate();
    });
  if (btnToggleEditor) btnToggleEditor.addEventListener("click", () => Editor.toggle());
  if (btnCloseEditor) btnCloseEditor.addEventListener("click", () => Editor.hide());

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) prevBtn.addEventListener("click", () => Slides.prev());
  if (nextBtn) nextBtn.addEventListener("click", () => Slides.next());

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") Slides.prev();
    if (e.key === "ArrowRight") Slides.next();
  });

  const progressList = document.getElementById("progressList");
  if (progressList) {
    progressList.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (li) Slides.showSlide(parseInt(li.dataset.i, 10));
    });
  }

  Editor.onChange(() => generate());

  applyDesign();
  generate();
}

document.addEventListener("DOMContentLoaded", init);
