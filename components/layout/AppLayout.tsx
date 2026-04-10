import Link from 'next/link'
import { KnackIcon } from '@/components/layout/KnackIcon'
import { APP_NAME } from '@/constants'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <nav className="mx-auto max-w-2xl px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 group" aria-label={`${APP_NAME} home`}>
            <KnackIcon
              size={28}
              className="transition-transform group-hover:scale-110 duration-200"
            />
            <span className="text-xl font-bold text-foreground tracking-tight">{APP_NAME}</span>
          </Link>
        </nav>
      </header>

      <main className={cn('flex-1 mx-auto w-full max-w-2xl px-4', className)}>{children}</main>
    </div>
  )
}
