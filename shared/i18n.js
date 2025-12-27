// Simple i18n engine (no reload). Use data-i18n="key" in elements.
const I18N = (() => {
  let lang = localStorage.getItem("imobipro_lang") || "pt";
  let dict = {};
  async function load(l) {
    lang = l;
    localStorage.setItem("imobipro_lang", lang);
    const res = await fetch(`/shared/i18n/${lang}.json`);
    dict = await res.json();
    apply();
  }
  function t(key, vars={}) {
    let s = (dict && dict[key]) ? dict[key] : key;
    Object.keys(vars).forEach(k => { s = s.replaceAll(`{{${k}}}`, String(vars[k])); });
    return s;
  }
  function apply() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
  }
  return { load, t, apply, get lang(){return lang;} };
})();
window.I18N = I18N;
document.addEventListener("DOMContentLoaded", () => { I18N.load(I18N.lang).catch(()=>{}); });
