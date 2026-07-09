import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Shield, Loader2, UserCheck, UserX,
  ShieldCheck, Search, Microscope, Activity, User2,
} from 'lucide-react'
import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast }  from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'
import type { User, UserRole } from '@/types'

// ── Role catalogue ─────────────────────────────────────────────────────────
export const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',              label: 'Admin'              },
  { value: 'department_manager', label: 'Dept. Manager'      },
  { value: 'investigator',       label: 'Investigator'       },
  { value: 'action_owner',       label: 'Action Owner'       },
  { value: 'staff',              label: 'Staff'              },
]

// ── Role appearance map ─────────────────────────────────────────────────────
const ROLE_META: Record<
  UserRole,
  { label: string; color: string; Icon: React.ElementType }
> = {
  admin:              { label: 'Admin',         color: 'text-red-400     bg-red-500/10     border-red-500/30',     Icon: ShieldCheck },
  department_manager: { label: 'Dept. Manager', color: 'text-orange-400  bg-orange-500/10  border-orange-500/30',  Icon: Shield      },
  investigator:       { label: 'Investigator',  color: 'text-violet-400  bg-violet-500/10  border-violet-500/30',  Icon: Microscope  },
  action_owner:       { label: 'Action Owner',  color: 'text-cyan-400    bg-cyan-500/10    border-cyan-500/30',    Icon: Activity    },
  staff:              { label: 'Staff',         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', Icon: User2       },
}

/** Compact role badge displayed in the table trigger */
function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role as UserRole] ?? ROLE_META.investigator
  const { Icon, label, color } = meta
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3 flex-shrink-0" />
      {label}
    </span>
  )
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,       setRole]       = useState<UserRole>('staff')
  const [department, setDepartment] = useState('')
  const [search,     setSearch]     = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => usersApi.list(),
  })

  const allUsers: User[] = data?.data.data ?? []
  const users = allUsers.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const createMut = useMutation({
    mutationFn: () => usersApi.create({ name, email, password, role: role as any, department: department || undefined }),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'User created', variant: 'success' })
      setShowForm(false); setName(''); setEmail(''); setPassword(''); setRole('staff'); setDepartment('')
    },
    onError: (e: any) => toast({ title: e.response?.data?.error ?? 'Failed', variant: 'destructive' }),
  })

  const roleMut = useMutation({
    mutationFn: ({ id, role, dept }: { id: number; role: string; dept?: string }) =>
      usersApi.updateRole(id, role, dept),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast({ title: 'Role updated', variant: 'success' }) },
    onError:    () => toast({ title: 'Failed to update role', variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allUsers.length} registered users</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {/* ── Create User form ─────────────────────────────────────────────── */}
      {showForm && (
        <Card className="border-primary/25 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Department <span className="text-xs text-muted-foreground">(for Dept. Manager)</span></Label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">No Department</option>
                  {['Emergency Department','ICU','General Ward','Operating Theatre','Pharmacy','Radiology','Laboratory','Maternity','Outpatient Clinic','Administration','Facilities & Maintenance','Nursing'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="flex items-center gap-2">
                          {(() => {
                            const meta = ROLE_META[r.value]
                            const Icon = meta.Icon
                            return <Icon className={`h-3.5 w-3.5 ${meta.color.split(' ')[0]}`} />
                          })()}
                          {r.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                onClick={() => createMut.mutate()}
                disabled={!name || !email || !password || createMut.isPending}
              >
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Users table ──────────────────────────────────────────────────── */}
      <Card>
        {/* Search bar */}
        <div className="px-4 pt-4 pb-3 border-b border-border/40">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <CardContent className="pt-0 px-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {['User', 'Email', 'Role', 'Status', 'Joined', 'ID'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {users.map(u => {
                    const currentMeta = ROLE_META[u.role as UserRole] ?? ROLE_META.investigator
                    return (
                      <tr key={u.id} className="hover:bg-accent/30 transition-colors group">
                        {/* User avatar + name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground whitespace-nowrap">{u.name}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>

                        {/* Role selector */}
                        <td className="px-4 py-3">
                          <Select
                            value={u.role}
                            onValueChange={newRole => roleMut.mutate({ id: u.id, role: newRole })}
                          >
                            <SelectTrigger
                              className={`h-7 text-xs font-medium border rounded-full px-2.5 py-0 w-auto gap-1.5 ${currentMeta.color}`}
                            >
                              <currentMeta.Icon className="h-3 w-3 flex-shrink-0" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => {
                                const m = ROLE_META[r.value]
                                return (
                                  <SelectItem key={r.value} value={r.value}>
                                    <span className="flex items-center gap-2">
                                      <m.Icon className={`h-3.5 w-3.5 ${m.color.split(' ')[0]}`} />
                                      {r.label}
                                    </span>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Active / Inactive */}
                        <td className="px-4 py-3">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <UserCheck className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <UserX className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>

                        {/* Joined date */}
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* ID */}
                        <td className="px-4 py-3 text-xs text-muted-foreground/60">#{u.id}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Role legend ──────────────────────────────────────────────────── */}
      <Card className="border-border/30">
        <CardContent className="py-3 px-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">Role Legend</p>
          <div className="flex flex-wrap gap-3">
            {ROLES.map(r => (
              <RoleBadge key={r.value} role={r.value} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
