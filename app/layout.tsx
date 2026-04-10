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
  metadataBase: new URL('https://knack.vercel.app'),
  title: {
    default: `${APP_NAME} - Master Any Hobby`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Knack helps you master any hobby with AI-powered roadmaps, technique-focused coaching, contextual chat, and notes that actually improve practice.',
  keywords: [
    'AI learning roadmap',
    'hobby learning',
    'skill development',
    'boxing technique coach',
    'practice notes',
    'learning plan',
  ],
  icons: {
    icon: '/branding/knack-mark.svg',
    shortcut: '/branding/knack-mark.svg',
    apple: '/branding/knack-mark.svg',
  },
  openGraph: {
    title: `${APP_NAME} — Master Any Hobby`,
    description:
      'Focused AI skill roadmaps with technique guidance, contextual chat, and notes-first learning.',
    url: 'https://knack.vercel.app',
    siteName: APP_NAME,
    images: [
      {
        url: '/branding/863shots_so.png',
        width: 1024,
        height: 1024,
        alt: `${APP_NAME} product mockup`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Master Any Hobby`,
    description:
      'AI-powered skill roadmaps and contextual technique coaching that keeps learners in flow.',
    images: ['/branding/863shots_so.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      suppressHydrationWarning
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
