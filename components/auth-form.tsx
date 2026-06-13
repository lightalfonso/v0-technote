'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MonitorCog, Lock, Mail, User, ArrowRight, Terminal } from 'lucide-react'
import { getEmailByName } from '@/app/actions/auth'

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

    let loginEmail = email
    if (!isSignUp && !email.includes('@')) {
      const resolvedEmail = await getEmailByName(email)
      if (!resolvedEmail) {
        setError('Usuario no encontrado')
        setLoading(false)
        return
      }
      loginEmail = resolvedEmail
    }

    const { error } = isSignUp
      ? await authClient.signUp.email({ email: loginEmail, password, name })
      : await authClient.signIn.email({ email: loginEmail, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Ocurrió un error')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.6 0.22 264) 1px, transparent 1px), linear-gradient(90deg, oklch(0.6 0.22 264) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.6 0.22 264)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-lg opacity-40" style={{ background: 'oklch(0.6 0.22 264)' }} />
            <div className="relative rounded-2xl p-3.5" style={{ background: 'oklch(0.6 0.22 264)' }}>
              <MonitorCog className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">TechNotes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gestión técnica profesional</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-2xl">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Regístrate para comenzar a gestionar tu trabajo' : 'Accede a tu espacio de trabajo técnico'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-foreground text-sm">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Tu nombre completo"
                    autoComplete="name"
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-foreground text-sm">
                {isSignUp ? 'Correo electrónico' : 'Usuario o correo electrónico'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={isSignUp ? "tu@correo.com" : "Usuario o correo electrónico"}
                  autoComplete="email"
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-foreground text-sm">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-lg" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1 gap-2 font-medium">
              {loading ? 'Procesando...' : isSignUp ? 'Crear cuenta' : 'Ingresar'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {isSignUp && (
            <div className="mt-5 pt-5 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/sign-in"
                  className="text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Features hint */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {['Notas & Agenda', 'Licencias', 'Equipos & Seriales'].map((f) => (
            <div key={f} className="px-2 py-2 rounded-lg bg-card/50 border border-border/50">
              <p className="text-xs text-muted-foreground leading-tight">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
