import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'

import appCss from '../styles.css?url'
import { seo, BRAND_COLOR, SITE_NAME } from '@/lib/seo'

const queryClient = new QueryClient()

function LoadingBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/20">
      <div className="h-full w-2/5 animate-pulse rounded-r-full bg-primary" />
    </div>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'theme-color',
        content: BRAND_COLOR,
      },
      ...seo({ title: SITE_NAME }),
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
        sizes: '48x48',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: '/icon-192.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@600;700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
    scripts: [
      {
        type: 'text/javascript',
        children: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches))document.documentElement.classList.add('dark')}catch(e){}})();if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){})}`,
      },
    ],
  }),
  component: RootDocument,
  pendingComponent: LoadingBar,
})

function RootDocument() {
  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body suppressHydrationWarning>
          <Suspense fallback={<LoadingBar />}>
            <TooltipProvider>
              <Outlet />
            </TooltipProvider>
          </Suspense>
          <Toaster richColors position="top-right" />
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  )
}
