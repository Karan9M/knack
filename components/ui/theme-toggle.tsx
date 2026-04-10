'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Theme, applyTheme, resolveTheme, storeTheme } from '@/lib/theme'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const resolved = resolveTheme()
    setTheme(resolved)
    applyTheme(resolved)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    storeTheme(next)
  }

  // Render a placeholder with the same size to prevent layout shift on mount
  if (!mounted) {
    return <div className={cn('h-9 w-9 shrink-0', className)} aria-hidden />
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={cn(
        'relative h-9 w-9 rounded-full shrink-0',
        'flex items-center justify-center',
        'text-muted-foreground hover:text-foreground',
        'hover:bg-muted/50 transition-colors duration-150',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ rotate: -45, opacity: 0, scale: 0.75 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 45, opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Moon className="h-[17px] w-[17px]" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 45, opacity: 0, scale: 0.75 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -45, opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Sun className="h-[17px] w-[17px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
