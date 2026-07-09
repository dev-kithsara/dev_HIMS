import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search, Plus, Filter, Download, Trash2,
  Eye, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Zap, Sparkles,
} from 'lucide-react'
import { PieChart, Pie, Cell } from 'recharts'
import { incidentsApi, aiApi } from '@/lib/api'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { Badge }   from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast }   from '@/components/ui/toaster'
import { severityClass, statusClass, formatDate, downloadBlob } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Incident } from '@/types'

const RISK_TEXT = (score: number) => {
  if (score >= 80) return 'text-red-400'
  if (score >= 60) return 'text-orange-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-green-400'
}

const RiskGauge = ({ score, size = 110 }: { score: number; size?: number }) => {
  const data = [{ name: 'risk', value: score }, { name: 'rest', value: 100 - score }]
  const colors = score >= 80 ? ['#ef4444', '#1e1e2e']
                : score >= 60 ? ['#f97316', '#1e1e2e']
                : score >= 40 ? ['#eab308', '#1e1e2e']
                : ['#22c55e', '#1e1e2e']
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2 - 4}
          cy={size / 2 - 4}
          innerRadius={size * 0.32}
          outerRadius={size * 0.46}
          startAngle={225}
          endAngle={-45}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-black ${RISK_TEXT(score)}`}>{Math.round(score)}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-widest">/100</span>
      </div>
    </div>
  )
}

const SevBadge = ({ sev }: { sev: string }) => {
  const col: Record<string, string> = {
    LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${col[sev] ?? col.MEDIUM}`}>
      {sev}
    </span>
  )
}

const LIMIT = 10

export default function IncidentsPage() {
  const user        = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState('')
  const [severity,   setSeverity]   = useState('')
  const [department, setDepartment] = useState('')

  const [predTitle, setPredTitle] = useState('')
  const [predDesc, setPredDesc] = useState('')
  const [predCat, setPredCat] = useState('')
  const [predDept, setPredDept] = useState('')
  const [predResult, setPredResult] = useState<any>(null)

  const predictMutation = useMutation({
    mutationFn: () => aiApi.predictRisk({
      title: predTitle,
      description: predDesc,
      category: predCat || undefined,
      department: predDept || undefined,
    }),
    onSuccess: (res) => {
      setPredResult(res.data as any)
    },
    onError: () => {
      toast({ title: 'Failed to predict risk score', variant: 'destructive' })
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', page, search, status, severity, department],
    queryFn:  () => incidentsApi.list({ page, limit: LIMIT, search, status, severity, department }),
    placeholderData: (prev) => prev,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => incidentsApi.delete(id),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast({ title: 'Incident deleted', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  })

  const handleExport = async () => {
    const res = await incidentsApi.export({ search, status, severity })
    downloadBlob(new Blob([res.data as any], { type: 'text/csv' }), 'incidents.csv')
    toast({ title: 'Export downloaded', variant: 'success' })
  }

  const incidents: Incident[] = data?.data.data ?? []
  const meta = data?.data.meta

  const clearFilters = () => { setSearch(''); setStatus(''); setSeverity(''); setDepartment(''); setPage(1) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta?.total ?? 0} total incidents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          {user?.role === 'staff' && (
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/incidents/new">
                <Plus className="h-3.5 w-3.5" /> New Incident
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search incidents..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>

            <Select value={status || 'all'} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[145px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="PENDING_ACTION">Pending Action</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severity || 'all'} onValueChange={v => { setSeverity(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[135px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            {(search || status || severity) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0 px-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-3 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No incidents found</p>
              {user?.role !== 'investigator' && user?.role !== 'action_owner' && (
                <Button asChild size="sm">
                  <Link to="/incidents/new">Create your first incident</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {['ID', 'Title', 'Severity', 'Status', 'Category', 'Department', 'Reporter', 'Date', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {incidents.map(inc => (
                    <tr key={inc.id} className="hover:bg-accent/30 transition-colors group">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">#{inc.id}</td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {inc.title}
                        </p>
                        {inc.aiProcessed && (
                          <span className="text-[10px] text-cyan-400 flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI processed</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 font-medium ${severityClass(inc.severity)}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 font-medium ${statusClass(inc.status)}`}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.category ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.department ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.reporter?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(inc.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                            <Link to={`/incidents/${inc.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'department_manager') && (
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm('Delete this incident?')) deleteMut.mutate(inc.id) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between text-sm mt-4">
          <p className="text-muted-foreground">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex h-8 items-center px-3 text-xs rounded-md bg-card border border-border">
              {page} / {meta.pages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= meta.pages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Live Risk Predictor sandbox (only for Investigators) */}
      {user?.role === 'investigator' && (
        <Card className="relative overflow-hidden mt-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" /> Live Risk Predictor
            </CardTitle>
            <p className="text-xs text-muted-foreground">Describe a hypothetical or newly assigned incident and get an instant AI risk score</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <input
                id="pred-title"
                value={predTitle}
                onChange={e => setPredTitle(e.target.value)}
                placeholder="Incident title…"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
              />
              <textarea
                id="pred-desc"
                value={predDesc}
                onChange={e => setPredDesc(e.target.value)}
                placeholder="Describe the incident in detail…"
                rows={3}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none transition"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="pred-cat"
                  value={predCat}
                  onChange={e => setPredCat(e.target.value)}
                  placeholder="Category (optional)"
                  className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
                />
                <input
                  id="pred-dept"
                  value={predDept}
                  onChange={e => setPredDept(e.target.value)}
                  placeholder="Department (optional)"
                  className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
                />
              </div>
            </div>

            <button
              id="predict-risk-btn"
              onClick={() => predictMutation.mutate()}
              disabled={!predTitle.trim() || !predDesc.trim() || predDesc.length < 10 || predictMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {predictMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
              ) : (
                <><Zap className="h-4 w-4" /> Predict Risk</>
              )}
            </button>

            {/* Result */}
            {predResult && (
              <div className="mt-2 rounded-xl border border-border bg-background/60 p-4 animate-fade-in">
                <div className="flex items-center gap-4">
                  <RiskGauge score={predResult.risk_score} size={110} />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Predicted Level</p>
                      <SevBadge sev={predResult.risk_label} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p>
                      <p className="text-sm font-bold text-foreground">{(predResult.confidence * 100).toFixed(1)}%</p>
                    </div>
                    {predResult.contributing_factors?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Key Factors</p>
                        <div className="flex flex-wrap gap-1">
                          {predResult.contributing_factors.map((f: string) => (
                            <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                              {f.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
