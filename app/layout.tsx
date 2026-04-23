import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sistema Felipa",
  description: "Gestión de stock y ventas — Bazar Felipa",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
}
