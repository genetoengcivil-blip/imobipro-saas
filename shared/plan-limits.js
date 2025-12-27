// Plan limits enforcement (client-side helper). Server must enforce too.
export const PLAN_LIMITS = {
  basic: { max_properties: 20, max_leads_month: 50, reports_advanced: false, whatsapp_automation: false },
  pro: { max_properties: 100, max_leads_month: 200, reports_advanced: true, whatsapp_automation: false },
  premium: { max_properties: Infinity, max_leads_month: Infinity, reports_advanced: true, whatsapp_automation: true },
};

export function canUse(feature, plan) {
  const p = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
  return Boolean(p[feature]);
}
