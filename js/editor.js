const ELEMENT_ID = "markdownInput";
const OVERLAY_ID = "editorOverlay";

const defaultContent = `# Corozo
## Presentación de ejemplo

- Soporte de **negrita** y _cursiva_
- Listas ordenadas y desordenadas
- Tablas e imágenes

---

## Formato de texto

Puedes usar **negrita** para resaltar ideas.

Y _cursiva_ para dar énfasis.

---

## Tabla de estado

| Módulo | Estado |
| ------ | ------ |
| Parser | ✅ |
| **Negrita** | ✅ |
| _Cursiva_ | ✅ |
| Exportar HTML | ✅ |

---

## Imagen

![Markdown](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)

---

## Fin

Gracias por usar **Corozo**.`;

function getElement() {
  return document.getElementById(ELEMENT_ID);
}

function getOverlay() {
  return document.getElementById(OVERLAY_ID);
}

function getValue() {
  const el = getElement();
  return el ? el.value : "";
}

function setValue(text) {
  const el = getElement();
  if (el) el.value = text;
}

function onChange(callback) {
  const el = getElement();
  if (!el) return;
  el.addEventListener("input", () => callback(el.value));
}

function show() {
  const overlay = getOverlay();
  if (overlay) overlay.classList.add("open");
}

function hide() {
  const overlay = getOverlay();
  if (overlay) overlay.classList.remove("open");
}

function toggle() {
  const overlay = getOverlay();
  if (overlay) overlay.classList.toggle("open");
}

function init() {
  const el = getElement();
  if (el && !el.value.trim()) {
    el.value = defaultContent;
  }
}

export const Editor = {
  getValue,
  setValue,
  onChange,
  init,
  show,
  hide,
  toggle,
  defaultContent,
};
