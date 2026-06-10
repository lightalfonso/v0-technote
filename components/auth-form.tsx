'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { MonitorCog } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Ocurrió un error')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="bg-primary rounded-xl p-3">
            <MonitorCog className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">TechNotes</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu trabajo técnico</p>
        </div>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp ? 'Regístrate para comenzar' : 'Accede a tu espacio de trabajo'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? 'Procesando...' : isSignUp ? 'Crear cuenta' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-5">
            {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
