'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateUser, deleteUser } from '@/app/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Search, Pencil, Trash2, ShieldCheck, Mail, Calendar, User, Copy, Check, AlertTriangle } from 'lucide-react'

const ADMIN_EMAIL = 'alfonso@latenciacero.cl'

interface UserAdmin {
  id: string
  name: string
  email: string
  createdAt: Date
}

function CopyButton({ text, title = "Copiar" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6 inline-flex ml-1 text-muted-foreground/60 hover:text-foreground"
      onClick={handleCopy}
      title={title}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

function UserEditForm({
  user,
  onClose,
}: {
  user: UserAdmin
  onClose: () => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isRootAdmin = user.email.toLowerCase() === ADMIN_EMAIL

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!email.trim()) return
    setError(null)

    startTransition(async () => {
      try {
        await updateUser(user.id, {
          name: name.trim(),
          email: email.trim(),
        })
        onClose()
      } catch (err: any) {
        setError(err.message || 'Error al actualizar el usuario')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-lg" role="alert">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-name">Nombre</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nombre del usuario"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-email">Correo Electrónico</Label>
        <Input
          id="edit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isRootAdmin}
          placeholder="correo@ejemplo.com"
          className={isRootAdmin ? "bg-muted cursor-not-allowed" : ""}
        />
        {isRootAdmin && (
          <p className="text-[11px] text-muted-foreground">
            No se permite cambiar el correo de la cuenta administradora principal.
          </p>
        )}
      </div>
      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Actualizar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserAdmin[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<UserAdmin | null>(null)
  const [deleteUserObj, setDeleteUserObj] = useState<UserAdmin | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const filtered = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleDelete = (targetUser: UserAdmin) => {
    setDeleteError(null)
    startTransition(async () => {
      try {
        await deleteUser(targetUser.id)
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id))
        setDeleteUserObj(null)
      } catch (err: any) {
        setDeleteError(err.message || 'Error al eliminar el usuario')
      }
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administración de Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''} en el sistema
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No se encontraron usuarios</p>
          <p className="text-xs text-muted-foreground mt-1">Intenta con otra búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((u) => {
            const isRootAdmin = u.email.toLowerCase() === ADMIN_EMAIL
            const isSelf = u.id === currentUserId

            return (
              <Card
                key={u.id}
                className="p-5 border border-border bg-card hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg p-2 ${isRootAdmin ? 'bg-indigo-500/10 text-indigo-500' : 'bg-primary/10 text-primary'}`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                          {u.name}
                          {isSelf && (
                            <span className="text-[10px] font-normal bg-secondary text-secondary-foreground border border-border px-1.5 py-0.5 rounded">
                              Tú
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {isRootAdmin ? (
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Administrador Root
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                              Usuario Técnico
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditUser(u)}
                        title="Editar usuario"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteUserObj(u)
                        }}
                        disabled={isRootAdmin || isSelf}
                        title={
                          isRootAdmin
                            ? "No se puede eliminar al Administrador Root"
                            : isSelf
                            ? "No puedes eliminar tu propio usuario"
                            : "Eliminar usuario"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground mt-4 border-t border-border pt-4">
                    <div className="flex items-center gap-2 group/item">
                      <Mail className="h-4 w-4 text-muted-foreground/80 flex-shrink-0" />
                      <span className="text-foreground truncate" title={u.email}>
                        {u.email}
                      </span>
                      <CopyButton text={u.email} title="Copiar correo" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground/80 flex-shrink-0" />
                      <span>
                        Registrado el:{' '}
                        {new Date(u.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog for Edit */}
      <Dialog
        open={editUser !== null}
        onOpenChange={(v) => {
          if (!v) setEditUser(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserEditForm
              user={editUser}
              onClose={() => setEditUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for Delete */}
      <Dialog
        open={deleteUserObj !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteUserObj(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Eliminación Crítica
            </DialogTitle>
          </DialogHeader>
          {deleteUserObj && (
            <div className="space-y-4">
              {deleteError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-lg" role="alert">
                  {deleteError}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Estás a punto de eliminar la cuenta del técnico{' '}
                <strong className="text-foreground">{deleteUserObj.name}</strong> ({deleteUserObj.email}).
              </p>
              <div className="p-3.5 bg-destructive/5 border border-destructive/10 rounded-lg text-xs text-destructive/90 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  ATENCIÓN: BORRADO EN CASCADA
                </p>
                <p>
                  Esta operación eliminará permanentemente todos los datos creados por este usuario, incluyendo:
                </p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Todos los Trabajos realizados.</li>
                  <li>Todos los Clientes registrados.</li>
                  <li>Todos los Equipos y Seriales de red.</li>
                  <li>Todas las Licencias de software y descargas.</li>
                  <li>Todas las Notas y Categorías asociadas.</li>
                  <li>Todos los eventos registrados en la Agenda.</li>
                </ul>
                <p className="font-medium mt-1.5">Esta acción es irreversible.</p>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteUserObj(null)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => handleDelete(deleteUserObj)}
                >
                  {isPending ? 'Eliminando...' : 'Sí, eliminar todo'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
