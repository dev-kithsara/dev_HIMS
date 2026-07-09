import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle, Clock, Eye, TrendingUp,
  Activity, ArrowRight, Zap, Lightbulb
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { statsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { severityClass, statusClass, formatDate } from '@/lib/utils'
import type { Stats } from '@/types'

const SEV_COLORS: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
}

const KpiCard = ({
  title, value, sub, icon: Icon, color,
}: { title: string; value: number; sub?: string; icon: React.ElementType; color: string }) => (
  <Card className="relative overflow-hidden">
    <div className={`absolute inset-0 ${color} opacity-5`} />
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} bg-opacity-20 border border-current/20`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const { data: res, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn:  () => statsApi.get(),
  })

  const stats: Stats | undefined = res?.data.data

  const sevChartData = stats
    ? Object.entries(stats.bySeverity).map(([k, v]) => ({ name: k, value: v, color: SEV_COLORS[k] }))
    : []

  const statusData = stats
    ? [
        { name: 'Open',        value: stats.open,        fill: '#3b82f6' },
        { name: 'In Progress', value: stats.inProgress,  fill: '#a855f7' },
        { name: 'Under Review',value: stats.underReview, fill: '#eab308' },
        { name: 'Closed',      value: stats.closed,      fill: '#22c55e' },
      ]
    : []

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (user?.role === 'staff') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome, <span className="gradient-text">{user?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Report incidents and track the progress of your submissions.
            </p>
          </div>
          <Link
            to="/incidents/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground btn-glow hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" /> Report New Incident
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="My Reports"    value={stats?.total         ?? 0} icon={Activity}     color="text-blue-400"   sub="Total submitted" />
          <KpiCard title="Open"          value={stats?.open          ?? 0} icon={Eye}          color="text-yellow-400" sub="Awaiting review" />
          <KpiCard title="Accepted"      value={stats?.accepted      ?? 0} icon={Clock}        color="text-purple-400" sub="Under management" />
          <KpiCard title="Resolved"      value={stats?.closed        ?? 0} icon={CheckCircle}  color="text-green-400"  sub="Incidents closed" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My submitted reports */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" /> My Submitted Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {stats?.recentIncidents && stats.recentIncidents.length > 0 ? (
                  stats.recentIncidents.map(inc => (
                    <Link
                      key={inc.id}
                      to={`/incidents/${inc.id}`}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors group border border-border/40"
                    >
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                        inc.severity === 'CRITICAL' ? 'bg-red-400' :
                        inc.severity === 'HIGH'     ? 'bg-orange-400' :
                        inc.severity === 'MEDIUM'   ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {inc.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(inc.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          inc.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                          inc.severity === 'HIGH'     ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' :
                          inc.severity === 'MEDIUM'   ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' :
                                                        'border-green-500/30 bg-green-500/10 text-green-400'
                        }`}>{inc.severity}</span>
                        <span className={`text-[10px] px-2 py-0.5 font-medium ${statusClass(inc.status)}`}>
                          {inc.status.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <AlertTriangle className="h-7 w-7 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No incidents reported yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      If you witness or experience an incident, use the button above to report it immediately.
                    </p>
                    <Link
                      to="/incidents/new"
                      className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      <Zap className="h-4 w-4" /> Report Your First Incident
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* What happens next guide */}
          <div className="space-y-4">
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> What Happens After You Submit?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: 1, title: 'Notification Sent', desc: 'The Incident Manager is instantly notified of your report.', color: 'bg-blue-500' },
                  { step: 2, title: 'Triage & Review',   desc: 'Your report is reviewed and an investigator is assigned.', color: 'bg-purple-500' },
                  { step: 3, title: 'Investigation',     desc: 'The assigned investigator investigates the root cause.', color: 'bg-yellow-500' },
                  { step: 4, title: 'Resolved & Closed', desc: 'The incident is fixed and marked as resolved.', color: 'bg-green-500' },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="flex gap-3">
                    <div className={`h-6 w-6 rounded-full ${color} flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold mt-0.5`}>
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5"><Lightbulb className="h-3 w-3" /> Tips for a good report</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Be as specific as possible about what happened</li>
                  <li>• Include exact location and time if known</li>
                  <li>• Mention anyone else who witnessed the event</li>
                  <li>• Note any immediate actions you already took</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (user?.role === 'investigator') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back,{' '}
              <span className="gradient-text">{user?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Here's your caseload overview and pending action items.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Assigned Incidents" value={stats?.total       ?? 0} icon={Activity}      color="text-blue-400"   sub="Total caseload" />
          <KpiCard title="Open"               value={stats?.open        ?? 0} icon={AlertTriangle}  color="text-red-400"    sub="Needs investigation" />
          <KpiCard title="Investigating"      value={stats?.investigating  ?? 0} icon={Clock}         color="text-purple-400" sub="Under investigation" />
          <KpiCard title="Resolved (Solved)"   value={stats?.closed      ?? 0} icon={CheckCircle}   color="text-green-400"  sub="Incidents solved" />
        </div>

        {/* Custom Investigator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Trackers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rejected Investigations */}
            {stats?.recentIncidents?.some((inc: any) => inc.isRejected) && (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2 text-base">
                    <AlertTriangle className="h-5 w-5 text-red-500 animate-bounce" /> Rejected Investigations
                  </CardTitle>
                  <p className="text-xs text-red-300/70">Investigations rejected by management. Please correct and resubmit.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.recentIncidents
                    .filter((inc: any) => inc.isRejected)
                    .map((inc: any) => (
                      <div key={inc.id} className="p-3 rounded-lg border border-red-500/25 bg-background/60 hover:bg-background/80 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-4">
                            <Link to={`/incidents/${inc.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                              #{inc.id} - {inc.title}
                            </Link>
                            <p className="text-xs text-red-400 mt-1.5 italic font-medium bg-red-500/10 p-2 rounded border border-red-500/20">
                              Reason: {inc.rejectionComment}
                            </p>
                          </div>
                          <Badge variant="destructive" className="text-[10px] tracking-wide font-bold uppercase">{inc.severity}</Badge>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Overdue Actions Tracker */}
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" /> Overdue Actions Tracker
                </CardTitle>
                <p className="text-xs text-red-300/70">Actions assigned to you that have passed their deadline</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.overdueActions && stats.overdueActions.length > 0 ? (
                  stats.overdueActions.map(act => (
                    <div key={act.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 rounded-lg border border-red-500/20 bg-background/50 hover:bg-background/80 transition-colors gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{act.actionTaken}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Incident: <Link to={`/incidents/${act.incidentId}`} className="text-primary hover:underline font-medium">#{act.incidentId} - {act.incident?.title}</Link>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px] tracking-wide font-bold uppercase">{act.priority}</Badge>
                        <span className="text-xs text-red-400 font-medium whitespace-nowrap bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          Due: {new Date(act.dueDate!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-green-400 text-center py-6">All clear! No overdue actions.</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Upcoming Tasks
                </CardTitle>
                <p className="text-xs text-muted-foreground">Action items scheduled for you</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.upcomingActions && stats.upcomingActions.length > 0 ? (
                  stats.upcomingActions.map(act => (
                    <div key={act.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{act.actionTaken}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Incident: <Link to={`/incidents/${act.incidentId}`} className="text-primary hover:underline">#{act.incidentId} - {act.incident?.title}</Link>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-semibold">{act.priority}</Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded">
                          Due: {new Date(act.dueDate!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No upcoming actions scheduled.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side caseload Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Severity breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sevChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {sevChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {sevChartData.map(s => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="ml-auto font-semibold text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent incidents (assigned caseload) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Assigned Caseload</CardTitle>
                <Link to="/incidents" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {stats?.recentIncidents.map(inc => (
                  <Link
                    key={inc.id}
                    to={`/incidents/${inc.id}`}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors group"
                  >
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      inc.severity === 'CRITICAL' ? 'bg-red-400' :
                      inc.severity === 'HIGH'     ? 'bg-orange-400' :
                      inc.severity === 'MEDIUM'   ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {inc.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(inc.createdAt)}</p>
                    </div>
                    {inc.status === 'OPEN' ? (
                      <span className="text-[10px] px-2 py-0.5 font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded uppercase">
                        New
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 font-medium ${statusClass(inc.status)}`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                    )}
                  </Link>
                ))}
                {!stats?.recentIncidents.length && (
                  <p className="text-sm text-muted-foreground text-center py-6">No incidents assigned to you</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (user?.role === 'department_manager') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Manager Overview,{' '}
              <span className="gradient-text">{user?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Triage new reports and oversee incident resolution.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Reported" value={stats?.total          ?? 0} icon={Activity}      color="text-blue-400"   sub="All time" />
          <KpiCard title="Open (Triage)"  value={stats?.open           ?? 0} icon={AlertTriangle}  color="text-red-400"    sub="Needs review" />
          <KpiCard title="Investigating"  value={stats?.investigating   ?? 0} icon={Clock}         color="text-purple-400" sub="Under investigation" />
          <KpiCard title="Resolved"       value={stats?.closed         ?? 0} icon={CheckCircle}   color="text-green-400"  sub="Incidents closed" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Triage Center (Open Incidents) */}
          <div className="lg:col-span-2">
            <Card className="border-red-500/20 bg-red-500/5 h-full">
              <CardHeader className="pb-3 border-b border-red-500/10">
                <CardTitle className="text-base flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" /> Action Required: Needs Triage
                </CardTitle>
                <p className="text-xs text-red-300/70">Incidents awaiting investigator assignment</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {stats?.recentIncidents?.filter(i => i.status === 'OPEN').length ? (
                  stats.recentIncidents.filter(i => i.status === 'OPEN').slice(0, 5).map(inc => (
                    <Link
                      key={inc.id}
                      to={`/incidents/${inc.id}`}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-background/80 bg-background/50 transition-colors border border-red-500/20 group"
                    >
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                        inc.severity === 'CRITICAL' ? 'bg-red-400' :
                        inc.severity === 'HIGH'     ? 'bg-orange-400' :
                        inc.severity === 'MEDIUM'   ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {inc.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reported: {formatDate(inc.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          inc.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                          inc.severity === 'HIGH'     ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' :
                          inc.severity === 'MEDIUM'   ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' :
                                                        'border-green-500/30 bg-green-500/10 text-green-400'
                        }`}>{inc.severity}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle className="h-10 w-10 text-green-500/50 mb-3" />
                    <p className="text-sm font-medium text-green-400">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">No pending incidents require triage.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Metrics */}
          <div className="space-y-6">
            {/* Severity Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={sevChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                      {sevChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {sevChartData.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="ml-auto font-semibold text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Top Categories</CardTitle>
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.topCategories?.slice(0, 4).map((c: any, i: number) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-foreground font-medium flex items-center gap-1.5">
                        <span className="text-muted-foreground">{i + 1}</span> {c.category}
                      </span>
                      <span className="text-primary font-bold">{c.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/80 rounded-full" 
                        style={{ width: `${Math.min(100, (c.count / Math.max(1, stats.total)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            <span className="gradient-text">{user?.name.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here's what's happening in your incident management system.
          </p>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total"       value={stats?.total       ?? 0} icon={Activity}      color="text-blue-400"   sub="All time" />
        <KpiCard title="Open"        value={stats?.open        ?? 0} icon={AlertTriangle}  color="text-red-400"    sub="Needs attention" />
        <KpiCard title="Investigating" value={stats?.investigating  ?? 0} icon={Clock}         color="text-purple-400" sub="Being handled" />
        <KpiCard title="Closed"      value={stats?.closed      ?? 0} icon={CheckCircle}   color="text-green-400"  sub="Resolved" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Severity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sevChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {sevChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {sevChartData.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-semibold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={statusData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map(d => <Cell key={d.name} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Incidents</CardTitle>
            <Link to="/incidents" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {stats?.recentIncidents.map(inc => (
              <Link
                key={inc.id}
                to={`/incidents/${inc.id}`}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors group"
              >
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                  inc.severity === 'CRITICAL' ? 'bg-red-400' :
                  inc.severity === 'HIGH'     ? 'bg-orange-400' :
                  inc.severity === 'MEDIUM'   ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {inc.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(inc.createdAt)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 font-medium ${statusClass(inc.status)}`}>
                  {inc.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
            {!stats?.recentIncidents.length && (
              <p className="text-sm text-muted-foreground text-center py-6">No incidents yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {stats?.topCategories.map((cat, i) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-foreground">{cat.category}</span>
                    <span className="text-xs font-semibold text-primary">{cat.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
                      style={{ width: `${(cat.count / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!stats?.topCategories.length && (
              <p className="text-sm text-muted-foreground text-center py-6">No category data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
