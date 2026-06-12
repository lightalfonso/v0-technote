'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  MonitorCog,
  StickyNote,
  CalendarDays,
  Laptop,
  HardDrive,
  Tag,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/trabajos', label: 'Trabajos', icon: Wrench },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/notas', label: 'Notas', icon: StickyNote },
  { href: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/dashboard/software', label: 'Software & Licencias', icon: Laptop },
  { href: '/dashboard/equipos', label: 'Equipos & Seriales', icon: HardDrive },
  { href: '/dashboard/categorias', label: 'Categorías', icon: Tag },
]

interface SidebarProps {
  userName: string
  userEmail: string
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const isAdmin = userEmail?.toLowerCase() === 'alfonso@latenciacero.cl'
  const items = isAdmin
    ? [
        ...navItems,
        { href: '/dashboard/usuarios', label: 'Usuarios', icon: ShieldCheck },
      ]
    : navItems

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-border', collapsed && 'justify-center px-0')}>
        <div className="bg-primary rounded-lg p-1.5 flex-shrink-0 shadow-lg shadow-primary/30">
          <MonitorCog className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground text-base tracking-tight">TechNotes</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-border p-2 flex flex-col gap-1">
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg bg-secondary/50 mb-1">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        )}
        <div className={cn('flex gap-1', collapsed ? 'flex-col items-center' : 'items-center')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            title="Cerrar sesión"
            className={cn(
              'text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center gap-2',
              collapsed ? 'w-10 h-10 p-0 justify-center' : 'flex-1 justify-start px-3'
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Cerrar sesión</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            className="w-10 h-10 p-0 justify-center text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  )
}
