export function applyPlanGuards(plan: 'basic' | 'pro' | 'premium') {
  const rules: Record<string, ('basic' | 'pro' | 'premium')[]> = {
    reports: ['pro', 'premium'],
    calendar: ['pro', 'premium'],
    api: ['premium'],
    multisite: ['premium'],
  }

  Object.entries(rules).forEach(([key, allowed]) => {
    if (!allowed.includes(plan)) {
      document.querySelectorAll(`[data-feature="${key}"]`)
        .forEach(el => {
          el.classList.add('opacity-40', 'pointer-events-none')
          el.setAttribute(
            'title',
            'Disponível apenas em plano superior'
          )
        })
    }
  })
}
