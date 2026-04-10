import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/constants'
import { TooltipProvider } from '@/components/ui/tooltip'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${APP_NAME} — Master Any Hobby`,
  description:
    'AI-powered hobby learning roadmaps. Get a focused plan of 5–8 techniques tailored to your level.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(dmSans.variable, 'h-full antialiased')}
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      <head>
        {/* Runs before first paint — applies saved theme class to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('knack-theme');if(!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
