import { AuthProvider } from '@/hooks/useAuth'
import '@/styles/tailwind.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
export const metadata: Metadata = {
  title: {
    template: '%s - Plate AI',
    default: 'Plate AI - AI-powered meal Analysis',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/css?f%5B%5D=switzer@400,500,600,700&amp;display=swap"
        />
        {/* logo */}
        <link rel="icon" href="/logo.svg" />
      </head>
      <AuthProvider>
        <body className="text-gray-950 antialiased">
          <Toaster />
          {children}</body>
      </AuthProvider>
    </html>
  )
}
