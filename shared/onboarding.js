// Onboarding checklist state in localStorage (demo). Prefer storing in Supabase for production.
const STEPS = [
  { key: "profile", label: "Completar perfil" },
  { key: "property", label: "Cadastrar primeiro imóvel" },
  { key: "lead", label: "Criar primeiro lead" },
  { key: "appointment", label: "Agendar um compromisso" },
  { key: "task", label: "Criar uma tarefa" },
];
export function getOnboarding() {
  try { return JSON.parse(localStorage.getItem("imobipro_onboarding")||"{}"); } catch { return {}; }
}
export function setStepDone(key) {
  const st = getOnboarding();
  st[key] = true;
  localStorage.setItem("imobipro_onboarding", JSON.stringify(st));
}
export function progress() {
  const st = getOnboarding();
  const done = STEPS.filter(s => st[s.key]).length;
  return { done, total: STEPS.length, pct: Math.round((done/STEPS.length)*100) };
}
export const ONBOARDING_STEPS = STEPS;
