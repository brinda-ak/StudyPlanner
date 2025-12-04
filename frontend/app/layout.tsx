import type { Metadata } from 'next'
import './globals.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

export const metadata: Metadata = {
  title: 'Study Planner',
  description: 'Your personal study planning and productivity app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  // Always wrap with GoogleOAuthProvider to avoid hook errors
  // If no client ID, use a placeholder that won't cause initialization errors
  const clientId = googleClientId || 'placeholder-client-id-for-provider'

  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={clientId}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}

