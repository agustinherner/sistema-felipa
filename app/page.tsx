import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

async function checkDatabase(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export default async function HomePage() {
  const dbStatus = await checkDatabase()

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <header className="space-y-1 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Sistema Felipa</h1>
          <p className="text-muted-foreground">Sprint 0 — Setup técnico</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Estado del sistema</CardTitle>
            <CardDescription>Verificación de conexión a la base de datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dbStatus.ok ? (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" aria-hidden />
                <span className="font-medium">DB OK</span>
              </div>
            ) : (
              <div className="space-y-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-600" aria-hidden />
                  <span className="font-medium">DB error</span>
                </div>
                <p className="break-all font-mono text-xs text-red-700">{dbStatus.error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button>Botón primario</Button>
              <Button variant="outline">Secundario</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
