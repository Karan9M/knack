export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem('knack-theme') as Theme) ?? null
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function storeTheme(theme: Theme) {
  localStorage.setItem('knack-theme', theme)
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}
