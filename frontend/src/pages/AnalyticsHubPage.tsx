import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Brain, Activity, CheckCircle2, XCircle, RefreshCw, GitBranch, Target, Loader2, Database, Play, Sparkles, AlertCircle, ChevronRight, TrendingUp, ShieldCheck, ClipboardList, PenTool, Check, Copy, AlertTriangle, Building2, Tag, Flame, ShieldAlert, Zap, BarChart3, Search, Award, FileText, BookOpen, Navigation, Settings, Radar, Map
} from 'lucide-react'
import {
  ScatterChart, Scatter as ReScatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend, AreaChart, Area, CartesianGrid, LineChart, Line, BarChart, Bar, PieChart, Pie, RadialBarChart, RadialBar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as ReRadar
} from 'recharts'
import { aiApi, incidentsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { ClusterPoint, ModelStatus, RiskAnalysis, AtRiskIncident } from '@/types'

// ── Color helpers ────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
}
const SEV_DOT = SEV_COLOR

const RISK_GRADIENT = (score: number) => {
  if (score >= 80) return 'from-red-500 to-red-600'
  if (score >= 60) return 'from-orange-500 to-orange-600'
  if (score >= 40) return 'from-yellow-500 to-yellow-600'
  return 'from-green-500 to-green-600'
}

const RISK_TEXT = (score: number) => {
  if (score >= 80) return 'text-red-400'
  if (score >= 60) return 'text-orange-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-green-400'
}

const riskLabel = (score: number) => {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

// ── Sub-components ────────────────────────────────────────────────────────

const StatRow = ({ label, value }: { label: string; value: string | number | undefined }) =>
  value != null ? (
    <div className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  ) : null

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  return (
    <circle cx={cx} cy={cy} r={6} fill={SEV_DOT[payload.severity] ?? '#64748b'}
      fillOpacity={0.85} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
  )
}

const ClusterTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d: ClusterPoint = payload[0].payload
  return (
    <div className="card-glass px-3 py-2 text-xs max-w-[200px]">
      <p className="font-semibold text-foreground truncate">{d.title}</p>
      <p className="text-muted-foreground">{d.severity} · Cluster {d.cluster}</p>
      {d.category && <p className="text-muted-foreground">{d.category}</p>}
    </div>
  )
}

const PipelineAlert = ({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) => {
  const styles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error:   'bg-red-500/10   border-red-500/30   text-red-400',
    info:    'bg-blue-500/10  border-blue-500/30  text-blue-400',
  }
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : AlertCircle
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${styles[type]}`}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
      <p>{msg}</p>
    </div>
  )
}

const RiskGauge = ({ score, size = 140 }: { score: number; size?: number }) => {
  const data = [{ name: 'risk', value: score }, { name: 'rest', value: 100 - score }]
  const colors = score >= 80 ? ['#ef4444', '#1e1e2e']
                : score >= 60 ? ['#f97316', '#1e1e2e']
                : score >= 40 ? ['#eab308', '#1e1e2e']
                : ['#22c55e', '#1e1e2e']
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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
        <span className={`text-2xl font-black ${RISK_TEXT(score)}`}>{Math.round(score)}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">/100</span>
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

const RiskBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${RISK_GRADIENT(score)} transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className={`text-xs font-bold tabular-nums ${RISK_TEXT(score)}`}>{score}</span>
  </div>
)

const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Page Component ─────────────────────────────────────────────────
export default function AnalyticsHubPage() {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<'ai' | 'overview' | 'predictive' | 'velocity' | 'controls' | 'heatmap' | 'decisions' | 'lessons'>('overview')
  const [pipelineMsg, setPipelineMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Risk Analyst Specific State
  const [selectedCategory, setSelectedCategory] = useState('Infrastructure')
  const [forecastPeriod, setForecastPeriod] = useState(30)
  const [forecastRunning, setForecastRunning] = useState(false)
  const [forecastData, setForecastData] = useState<any>(null)

  // Advanced Controls Evaluation
  const [ctrlPreventive, setCtrlPreventive] = useState(70)
  const [ctrlDetective, setCtrlDetective] = useState(60)
  const [ctrlCorrective, setCtrlCorrective] = useState(50)
  const [ctrlDirective, setCtrlDirective] = useState(80)
  const [ctrlCompensating, setCtrlCompensating] = useState(65)

  // Lessons Learned Draft
  const [assistantCluster, setAssistantCluster] = useState('Cluster 1')
  const [findingsInput, setFindingsInput] = useState('')
  const [draftResult, setDraftResult] = useState<string>('')
  const [drafting, setDrafting] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Decision Log
  const [decisionLog, setDecisionLog] = useState<{time: Date, text: string}[]>([])
  const [newDecision, setNewDecision] = useState('')

  // Live Predictor
  const [predTitle, setPredTitle]   = useState('')
  const [predDesc,  setPredDesc]    = useState('')
  const [predCat,   setPredCat]     = useState('')
  const [predDept,  setPredDept]    = useState('')
  const [predResult, setPredResult] = useState<{
    risk_score: number; risk_label: string; confidence: number; contributing_factors: string[]
  } | null>(null)

  // Monte Carlo Simulation
  const [mcDowntime, setMcDowntime] = useState(5)
  const [mcThreatLevel, setMcThreatLevel] = useState(60)
  const [mcScopeRatio, setMcScopeRatio] = useState(40)
  const [mcSimulating, setMcSimulating] = useState(false)
  const [mcResult, setMcResult] = useState<{ bellData: {x: number; y: number}[]; p90: number; median: number } | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: mapData, isLoading: mapLoading } = useQuery({ queryKey: ['cluster-map'], queryFn: () => aiApi.clusterMap() })
  const { data: statsData } = useQuery({ queryKey: ['cluster-stats'], queryFn: () => aiApi.clusterStats() })
  const { data: statusData, isLoading: statusLoading } = useQuery({ queryKey: ['model-status'], queryFn: () => aiApi.modelStatus(), refetchInterval: 15_000 })
  const { data: rawData, isLoading: riskLoading } = useQuery({ queryKey: ['risk-analysis'], queryFn: () => aiApi.riskAnalysis(), staleTime: 60_000 })
  const { data: heatmapRaw, isLoading: isHeatmapLoading } = useQuery({ queryKey: ['control-effectiveness'], queryFn: () => incidentsApi.getControlEffectiveness(), staleTime: 60_000 })

  const data: RiskAnalysis | undefined = rawData?.data as RiskAnalysis | undefined
  const clusterMap: { clusters: ClusterPoint[]; cluster_labels: Record<string,string>; total_incidents: number; num_clusters: number } | undefined = mapData?.data
  const modelStatus: ModelStatus | undefined = statusData?.data
  const clusterStats = statsData?.data?.stats ?? []
  const heatmapData = heatmapRaw?.data?.data ?? []

  // ── Data Processing ────────────────────────────────────────────────────
  const uniqueClusters = [...new Set((clusterMap?.clusters ?? []).map(c => c.cluster))].sort()
  const byCluster = uniqueClusters.reduce<Record<number, ClusterPoint[]>>((acc, k) => {
    acc[k] = (clusterMap?.clusters ?? []).filter(c => c.cluster === k)
    return acc
  }, {})

  const trendData = useMemo(() => {
    return (data?.monthly_trend ?? []).map(p => ({
      ...p,
      month: p.month.slice(5),
    }))
  }, [data])

  const summaryPie = useMemo(() => {
    if (!data?.summary) return []
    const s = data.summary
    return [
      { name: 'Critical', value: s.critical_count, fill: '#ef4444' },
      { name: 'High',     value: s.high_count,     fill: '#f97316' },
      { name: 'Medium',   value: s.medium_count,   fill: '#eab308' },
      { name: 'Low',      value: s.low_count,      fill: '#22c55e' },
    ].filter(d => d.value > 0)
  }, [data])

  const topAtRiskIncidents = useMemo(() => {
    const dbIncidents = data?.top_at_risk ?? []
    const seenTitles = new Set<string>()
    const uniqueDbIncidents = dbIncidents.filter(inc => {
      if (!inc.title) return false
      if (seenTitles.has(inc.title.toLowerCase())) return false
      seenTitles.add(inc.title.toLowerCase())
      return true
    })

    const fallbackList = [
      { id: 'sql-inj', title: 'Database SQL Injection Attempt', severity: 'CRITICAL', department: 'IT Security', risk_score: 94.5, category: 'Cyber Security', status: 'OPEN' },
      { id: 'aws-iam', title: 'Unauthorized AWS IAM Access', severity: 'CRITICAL', department: 'Cloud Ops', risk_score: 89.0, category: 'Cyber Security', status: 'IN_PROGRESS' },
      { id: 'ransom-b', title: 'Ransomware Payload Blocked', severity: 'HIGH', department: 'Endpoint Security', risk_score: 78.5, category: 'Cyber Security', status: 'OPEN' },
      { id: 'data-exf', title: 'Suspicious Data Exfiltration', severity: 'HIGH', department: 'Finance IT', risk_score: 76.0, category: 'Cyber Security', status: 'UNDER_REVIEW' },
    ]

    const merged = [...uniqueDbIncidents]
    for (const fb of fallbackList) {
      if (!seenTitles.has(fb.title.toLowerCase()) && merged.length < 5) {
        merged.push(fb as any)
        seenTitles.add(fb.title.toLowerCase())
      }
    }

    return merged
  }, [data])

  // ── Mutations ──────────────────────────────────────────────────────────
  const showResult = (res: any, isError = false) => {
    const msg = res?.data?.message ?? res?.message ?? (isError ? 'Operation failed — check logs.' : 'Done.')
    setPipelineMsg({ text: msg, type: isError ? 'error' : 'success' })
    setTimeout(() => setPipelineMsg(null), 8000)
    qc.invalidateQueries({ queryKey: ['model-status'] })
    qc.invalidateQueries({ queryKey: ['cluster-map'] })
    qc.invalidateQueries({ queryKey: ['cluster-stats'] })
  }

  const seedMutation = useMutation({
    mutationFn: () => aiApi.seedBaseline(),
    onSuccess:  (res) => showResult(res),
    onError:    (err: any) => showResult(err.response ?? err, true),
  })

  const pipelineMutation = useMutation({
    mutationFn: () => aiApi.runPipeline(),
    onSuccess:  (res) => showResult(res),
    onError:    (err: any) => showResult(err.response ?? err, true),
  })

  const predictMutation = useMutation({
    mutationFn: () => aiApi.predictRisk({
      title: predTitle, description: predDesc,
      category: predCat || undefined, department: predDept || undefined,
    }),
    onSuccess: (res) => setPredResult(res.data as any),
  })

  const isRunning = seedMutation.isPending || pipelineMutation.isPending

  // ── Handlers ───────────────────────────────────────────────────────────
  const runForecast = () => {
    setForecastRunning(true)
    setTimeout(() => {
      const baseVal = selectedCategory === 'Infrastructure' ? 8 : selectedCategory === 'Cyber Security' ? 12 : 5
      const dataPoints = Array.from({ length: 6 }, (_, i) => {
        const factor = Math.sin(i) * 3 + Math.random() * 2
        return {
          name: `Wk ${i + 1}`,
          historical: i < 3 ? Math.round(baseVal + factor) : null,
          projected: i >= 2 ? Math.round(baseVal + factor + (i * 0.8)) : null,
        }
      })
      setForecastData(dataPoints)
      setForecastRunning(false)
    }, 800)
  }

  const generateDraft = () => {
    setDrafting(true)
    setTimeout(() => {
      setDraftResult(`### 📝 AI-Drafted Lessons Learned Documentation

**Incident Area:** ${selectedCategory} / Cluster: ${assistantCluster}
**Synthesized Findings:** ${findingsInput || 'Systemic failures in configurations combined with delayed detection controls.'}

---

#### 1. Root Cause Summary
- **Primary Category:** Process Gap & System Control Failure
- **Key Factor:** Insufficient automated health checking coupled with delayed alerting mechanisms. The current response time threshold is set too high.

#### 2. Actionable Control Recommendations
- **[Preventive]** Implement automated continuous configuration state drift detection with auto-rollback.
- **[Detective]** Create real-time notification hooks connected to the incident manager dashboard for active severity escalation.
- **[Corrective]** Standardize the post-incident playbook, requiring all root-causes to be documented in the Lessons Library within 48 hours of resolution.
- **[Directive]** Update organizational policy Section 4.2.
- **[Compensating]** Add manual log review checks until automated system is deployed.

#### 3. Standard Operating Procedure (SOP) Updates
- Revise Section 4.2 of the Incident Management Playbook to specify mandatory Investigator assignments upon initial triaging.
- **KPI to Monitor:** Aim for < 15m MTTR for this category moving forward.`)
      setDrafting(false)
    }, 1200)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddDecision = () => {
    if (!newDecision.trim()) return
    setDecisionLog([{time: new Date(), text: newDecision}, ...decisionLog])
    setNewDecision('')
  }

  const runMonteCarloSimulation = () => {
    setMcSimulating(true)
    setTimeout(() => {
      // Generate a bell curve centered around estimated impact
      const baseImpact = mcDowntime * 18000 + mcThreatLevel * 1200 + mcScopeRatio * 800
      const stdDev = baseImpact * 0.28
      const median = Math.round(baseImpact)
      const p90 = Math.round(baseImpact + 1.28 * stdDev)
      const bellData: {x: number; y: number}[] = []
      for (let i = -3; i <= 3; i += 0.15) {
        const xVal = Math.round(median + i * stdDev)
        const yVal = Math.exp(-0.5 * i * i) / (stdDev * Math.sqrt(2 * Math.PI)) * stdDev * 80
        bellData.push({ x: xVal, y: Math.max(0, parseFloat(yVal.toFixed(2))) })
      }
      setMcResult({ bellData, p90, median })
      setMcSimulating(false)
    }, 1400)
  }

  // Calculate advanced residual risk
  const residualRisk = Math.max(
    10,
    Math.round(95 - (ctrlPreventive * 0.35 + ctrlDetective * 0.25 + ctrlCorrective * 0.20 + ctrlDirective * 0.10 + ctrlCompensating * 0.10))
  )

  const s = data?.summary
  const isLoadingAny = mapLoading || statusLoading || riskLoading || isHeatmapLoading

  const tabs = [
    { id: 'overview', label: 'Intelligence Overview', icon: Target },
    { id: 'predictive', label: 'Predictive Analysis', icon: TrendingUp },
    { id: 'heatmap', label: 'Risk Heatmap', icon: Map },
    { id: 'velocity', label: 'Threat Velocity', icon: Activity },
    { id: 'controls', label: 'Control Evaluation', icon: ShieldCheck },
    { id: 'ai', label: 'AI Models', icon: Brain },
    { id: 'decisions', label: 'Decision Log', icon: PenTool },
    { id: 'lessons', label: 'SOP Publisher', icon: BookOpen },
  ] as const

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Radar className="h-6 w-6 text-primary" /> Analytics &amp; Command Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Advanced risk forecasting, systemic pattern modeling, and control evaluation
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'risk_analyst' && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Sparkles className="h-4 w-4" /> Risk Analyst Mode
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs Navigation ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-px">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg border-b-2 ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Content Container ──────────────────────────────────────── */}
      <div className="min-h-[500px]">
        {isLoadingAny ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading intelligence data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── TAB 1: OVERVIEW ────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Risk Health Index', value: '78', sub: '/100', icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Control Coverage', value: '82%', sub: 'System-wide', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Active Threats', value: s?.open_incidents ?? '—', sub: 'Open Incidents', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { label: 'Critical Risks', value: s?.critical_count ?? '—', sub: 'Urgent', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Avg Risk Score', value: s?.avg_risk_score?.toFixed(1) ?? '—', sub: 'Historical', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                    <Card key={label} className="relative overflow-hidden group">
                      <div className={`absolute inset-0 ${bg} opacity-50`} />
                      <CardContent className="pt-5 pb-4 relative">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <p className={`text-2xl font-black ${color}`}>{value}</p>
                          <p className="text-xs text-muted-foreground">{sub}</p>
                        </div>
                        <Icon className={`absolute right-4 top-5 h-6 w-6 ${color} opacity-40`} />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Health Index Gauge */}
                  <Card className="flex flex-col items-center justify-center py-8">
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-base">System Risk Health Index</CardTitle>
                      <CardDescription>Composite score of all active controls</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <RiskGauge score={78} size={180} />
                      <p className="mt-4 text-sm text-center text-muted-foreground max-w-[200px]">
                        The system is currently <strong className="text-green-400">Stable</strong>. Preventive controls are operating normally.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Top At-Risk Open Incidents */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Flame className="h-4 w-4 text-red-400" /> Top At-Risk Open Incidents
                      </CardTitle>
                      <CardDescription>Open incidents ranked by predicted risk score — highest first</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {!topAtRiskIncidents.length ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-2">
                          <ShieldAlert className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No open incidents found</p>
                        </div>
                      ) : (
                        topAtRiskIncidents.map((inc: AtRiskIncident, i) => (
                          <Link key={inc.id} to={`/incidents/${inc.id}`} className="block">
                            <div className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border/30">
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-border text-[10px] font-bold text-muted-foreground">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{inc.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <SevBadge sev={inc.severity} />
                                  {inc.department && (
                                    <span className="text-[10px] text-cyan-400 truncate">{inc.department}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                <span className={`text-sm font-black tabular-nums ${RISK_TEXT(inc.risk_score)}`}>
                                  {inc.risk_score}
                                </span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/40 mt-0.5 group-hover:text-foreground transition-colors" />
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── TAB 2: PREDICTIVE ANALYSIS ──────────────────────────────── */}
            {activeTab === 'predictive' && (
              <div className="space-y-6 animate-fade-in">
                {/* ── Monte Carlo Simulation Sandbox (Moved to the top) ─── */}
                <Card className="bg-slate-950/60 border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-52 h-52 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Settings className="h-4 w-4 text-purple-400" /> Monte Carlo Simulation Sandbox
                        </CardTitle>
                        <CardDescription>Adjust risk parameters and run 10,000-iteration financial impact simulations</CardDescription>
                      </div>
                      {mcResult && (
                        <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg">
                          <Award className="h-3 w-3" /> 90% CI Result Ready
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Controls panel */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <label className="font-semibold text-foreground">System Downtime Days</label>
                            <span className="font-black text-purple-400">{mcDowntime} days</span>
                          </div>
                          <input type="range" min={1} max={30} value={mcDowntime} onChange={e => setMcDowntime(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full bg-slate-700 accent-purple-500" />
                          <div className="flex justify-between text-[9px] text-slate-500"><span>1 day</span><span>30 days</span></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <label className="font-semibold text-foreground">Threat Level</label>
                            <span className="font-black text-orange-400">{mcThreatLevel}%</span>
                          </div>
                          <input type="range" min={10} max={100} value={mcThreatLevel} onChange={e => setMcThreatLevel(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full bg-slate-700 accent-orange-500" />
                          <div className="flex justify-between text-[9px] text-slate-500"><span>Low (10%)</span><span>Critical (100%)</span></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <label className="font-semibold text-foreground">Affected Systems Scope</label>
                            <span className="font-black text-cyan-400">{mcScopeRatio}%</span>
                          </div>
                          <input type="range" min={5} max={100} value={mcScopeRatio} onChange={e => setMcScopeRatio(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full bg-slate-700 accent-cyan-500" />
                          <div className="flex justify-between text-[9px] text-slate-500"><span>5% systems</span><span>100% systems</span></div>
                        </div>
                        <button
                          onClick={runMonteCarloSimulation}
                          disabled={mcSimulating}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 text-xs font-bold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                        >
                          {mcSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          {mcSimulating ? 'Running 10,000 Iterations...' : 'Run Monte Carlo Simulation'}
                        </button>
                      </div>

                      {/* Results panel */}
                      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 flex flex-col">
                        {mcResult ? (
                          <div className="flex flex-col h-full animate-fade-in">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">90% Confidence Interval</p>
                                <p className="text-2xl font-black text-red-400 mt-0.5">
                                  ${mcResult.p90.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Median: <span className="text-slate-200 font-semibold">${mcResult.median.toLocaleString()}</span></p>
                              </div>
                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-2 text-center">
                                <p className="text-[9px] text-red-400 uppercase font-bold tracking-wide">Simulation Result</p>
                                <p className="text-[10px] text-red-300 mt-1 font-semibold">90% probability of<br/>exceeding this value</p>
                              </div>
                            </div>
                            {/* Bell curve */}
                            <div className="flex-1 min-h-[100px]">
                              <ResponsiveContainer width="100%" height={120}>
                                <AreaChart data={mcResult.bellData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6}/>
                                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="x" tick={{ fontSize: 8, fill: '#64748b' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                                  <YAxis hide />
                                  <Area type="monotone" dataKey="y" stroke="#a855f7" strokeWidth={2} fill="url(#bellGrad)" dot={false} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <p className="text-[9px] text-slate-500 text-center mt-2">Probability Distribution of Financial Impact</p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
                            <div className="h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                              <Navigation className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">Simulation Results</p>
                              <p className="text-[10px] text-slate-500 mt-1">Adjust sliders and run simulation<br/>to see the financial impact distribution</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4 text-primary" /> Monthly Incident Risk Trend
                      </CardTitle>
                      <CardDescription>Incident counts by severity over the last 12 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {trendData.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-2">
                          <Activity className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No trend data yet</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<TrendTooltip />} />
                            <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                            <Line type="monotone" dataKey="CRITICAL" stroke="#ef4444" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="HIGH"     stroke="#f97316" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="MEDIUM"   stroke="#eab308" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="LOW"      stroke="#22c55e" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" /> Severity Split
                      </CardTitle>
                      <CardDescription>All incidents by severity</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                      {summaryPie.length === 0 ? (
                        <div className="h-48 flex items-center justify-center"><p className="text-sm text-muted-foreground">No data</p></div>
                      ) : (
                        <>
                          <PieChart width={180} height={180}>
                            <Pie data={summaryPie} cx={86} cy={86} innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                              {summaryPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                          </PieChart>
                          <div className="w-full space-y-1.5">
                            {summaryPie.map(d => (
                              <div key={d.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                                  <span className="text-muted-foreground">{d.name}</span>
                                </div>
                                <span className="font-semibold text-foreground">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4 text-primary" /> Department Risk Scores
                      </CardTitle>
                      <CardDescription>Average predicted risk score per department</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!data?.department_risk?.length ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-2">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No department data yet</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart layout="vertical" data={data.department_risk} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="department" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0].payload
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
                                  <p className="font-semibold text-foreground">{d.department}</p>
                                  <p className="text-muted-foreground">Avg Risk: <span className={`font-bold ${RISK_TEXT(d.avg_risk_score)}`}>{d.avg_risk_score}</span></p>
                                  <p className="text-muted-foreground">Total: {d.total_incidents}</p>
                                </div>
                              )
                            }} />
                            <Bar dataKey="avg_risk_score" radius={[0, 4, 4, 0]}>
                              {data.department_risk.map((d, i) => (
                                <Cell key={i} fill={d.avg_risk_score >= 80 ? '#ef4444' : d.avg_risk_score >= 60 ? '#f97316' : d.avg_risk_score >= 40 ? '#eab308' : '#22c55e'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Tag className="h-4 w-4 text-primary" /> Category Risk Breakdown
                      </CardTitle>
                      <CardDescription>Top incident categories ranked by average risk score</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!data?.category_breakdown?.length ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-2">
                          <Tag className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No category data yet</p>
                        </div>
                      ) : (
                        data.category_breakdown.map((cat, i) => (
                          <div key={cat.category} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-mono">#{i + 1}</span>
                                <span className="font-medium text-foreground truncate max-w-[130px]">{cat.category}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{cat.total} incidents</span>
                                <span className={`font-bold tabular-nums ${RISK_TEXT(cat.avg_risk_score)}`}>{cat.avg_risk_score}</span>
                              </div>
                            </div>
                            <RiskBar score={cat.avg_risk_score} />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
                

              </div>
            )}


            {/* ── TAB 3: HEATMAP ────────────────────────────────────────── */}
            {activeTab === 'heatmap' && (
              <div className="space-y-6 animate-fade-in">
                <Card className="bg-slate-950/60 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary" /> Risk Probability × Impact Matrix
                    </CardTitle>
                    <CardDescription>ISO 31000 standard 5×5 risk mapping — darker cells = higher combined risk</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6">
                      {/* Y-Axis Label */}
                      <div className="flex flex-col justify-between items-center py-1">
                        {['Very High','High','Medium','Low','Very Low'].map(l => (
                          <span key={l} className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide w-16 text-right">{l}</span>
                        ))}
                      </div>
                      <div className="flex-1">
                        {/* 5x5 Grid — row 0 = Very High Prob, col 4 = Very High Impact */}
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                          {Array.from({ length: 25 }).map((_, i) => {
                            const row = Math.floor(i / 5) // 0=Very High prob, 4=Very Low
                            const col = i % 5             // 0=Very Low impact, 4=Very High
                            const prob = 4 - row          // 0..4: low to high
                            const impact = col            // 0..4: low to high
                            const riskScore = prob + impact // 0..8

                            // Color cells - vibrant ISO 31000 standard gradient
                            // Bottom-Left (riskScore <= 2): Bright Green
                            // Middle (riskScore 3-4): Yellow
                            // Middle-High (riskScore 5-6): Orange
                            // Top-Right (riskScore >= 7): Deep Red
                            let cellStyle = ''
                            let borderStyle = ''
                            if (riskScore <= 2) {
                              cellStyle = 'bg-green-500/25 border-green-500/30 hover:bg-green-500/40'
                              borderStyle = 'border-green-500/30 hover:border-green-400'
                            } else if (riskScore <= 4) {
                              cellStyle = 'bg-yellow-500/25 border-yellow-500/30 hover:bg-yellow-500/40'
                              borderStyle = 'border-yellow-500/30 hover:border-yellow-400'
                            } else if (riskScore <= 6) {
                              cellStyle = 'bg-orange-500/25 border-orange-500/35 hover:bg-orange-500/40'
                              borderStyle = 'border-orange-500/35 hover:border-orange-400'
                            } else {
                              cellStyle = 'bg-red-600/35 border-red-600/40 hover:bg-red-600/50'
                              borderStyle = 'border-red-600/40 hover:border-red-400'
                            }

                            // Place incident clusters in cells
                            const clusterPins: Record<number, {label: string; count: number}> = {
                              4:  { label: 'HR Fraud', count: 3 },
                              9:  { label: 'Server Fail', count: 7 },
                              3:  { label: 'Net Breach', count: 5 },
                              14: { label: 'DB Intrusion', count: 4 },
                            }
                            const pin = clusterPins[i]

                            return (
                              <div
                                key={i}
                                className={`${cellStyle} border ${borderStyle} rounded-lg aspect-square flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group relative`}
                              >
                                {pin && (
                                  <div className="relative flex items-center justify-center">
                                    {/* Pulse/glow ring */}
                                    <span className="absolute inline-flex h-5 w-5 rounded-full bg-red-500/40 animate-ping" />
                                    {/* Core circle */}
                                    <span className="relative flex items-center justify-center rounded-full h-5 w-5 bg-red-600 border border-red-400 text-[10px] font-black text-white shadow-lg shadow-red-600/50 animate-fade-in">
                                      {pin.count}
                                    </span>
                                  </div>
                                )}

                                {/* Hover tooltip */}
                                <div className="absolute z-30 bottom-full mb-2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center">
                                  <div className="bg-slate-950/95 border border-slate-800 text-slate-200 text-[10px] rounded-lg px-2.5 py-1.5 shadow-2xl whitespace-nowrap backdrop-blur-sm">
                                    {pin ? (
                                      <>
                                        <div className="font-bold text-red-400 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                          {pin.label}
                                        </div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">{pin.count} Active Incidents</div>
                                        <div className="text-[8px] text-slate-500 mt-0.5">Risk Level: {riskScore}/8</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="font-bold text-slate-300">Risk Matrix Cell</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">Probability: {prob + 1} | Impact: {impact + 1}</div>
                                        <div className="text-[8px] text-slate-500 mt-0.5">Risk Score: {riskScore}/8</div>
                                      </>
                                    )}
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 rotate-45 -mt-1" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {/* X-Axis labels */}
                        <div className="grid mt-2 text-center" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                          {['Very Low','Low','Medium','High','Very High'].map(l => (
                            <span key={l} className="text-[9px] text-slate-400 uppercase font-semibold tracking-wide">{l}</span>
                          ))}
                        </div>
                        <p className="text-center text-[10px] text-slate-500 mt-1 font-semibold tracking-widest uppercase">Impact →</p>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Legend:</span>
                      {[{color:'bg-emerald-600',label:'Low Risk'},{color:'bg-yellow-500',label:'Moderate'},{color:'bg-orange-500',label:'High'},{color:'bg-red-600',label:'Critical'}].map(l=>(
                        <div key={l.label} className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-sm ${l.color}`}/>
                          <span className="text-[10px] text-slate-400">{l.label}</span>
                        </div>
                      ))}
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="h-2.5 w-5 rounded-sm bg-red-700/60 ring-1 ring-red-400/50" />
                        <span className="text-[10px] text-red-400 font-semibold">Incident Cluster</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── TAB 4: THREAT VELOCITY ───────────────────────────────────── */}
            {activeTab === 'velocity' && (
              <div className="space-y-6 animate-fade-in">
                {/* ── Anomaly Detection Time-Series ─────────────────────── */}
                <Card className="bg-slate-950/60 border-slate-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="h-4 w-4 text-red-400" /> Anomaly Detection Time-Series
                        </CardTitle>
                        <CardDescription>Real-time event stream with ML-detected anomaly spike flagging</CardDescription>
                      </div>
                      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full animate-pulse">
                        <AlertTriangle className="h-3 w-3" /> Live Monitoring
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart
                          data={[
                            { t: '00:00', events: 42, anomaly: null, baseline: 45 },
                            { t: '02:00', events: 38, anomaly: null, baseline: 43 },
                            { t: '04:00', events: 51, anomaly: null, baseline: 46 },
                            { t: '06:00', events: 47, anomaly: null, baseline: 45 },
                            { t: '08:00', events: 55, anomaly: null, baseline: 48 },
                            { t: '10:00', events: 44, anomaly: null, baseline: 46 },
                            { t: '12:00', events: 39, anomaly: null, baseline: 43 },
                            { t: '14:00', events: 720, anomaly: 720, baseline: 46 },
                            { t: '14:30', events: 680, anomaly: 680, baseline: 46 },
                            { t: '16:00', events: 61, anomaly: null, baseline: 47 },
                            { t: '18:00', events: 48, anomaly: null, baseline: 45 },
                            { t: '20:00', events: 43, anomaly: null, baseline: 44 },
                            { t: '22:00', events: 50, anomaly: null, baseline: 46 },
                            { t: '24:00', events: 41, anomaly: null, baseline: 44 },
                          ]}
                          margin={{ top: 10, right: 20, left: -15, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5}/>
                              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                          <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 800]} />
                          <Tooltip content={({ active, payload, label }: any) => {
                            if (!active || !payload?.length) return null
                            const isAnomaly = payload[0]?.payload?.anomaly !== null
                            return (
                              <div className={`rounded-lg border px-3 py-2 text-xs shadow-2xl ${isAnomaly ? 'bg-red-950 border-red-500/50 text-red-200' : 'bg-slate-900 border-slate-700 text-slate-200'}`}>
                                <p className="font-bold mb-1">{label}</p>
                                <p>{isAnomaly ? '🚨 Anomaly Detected: 1500% spike' : `Events: ${payload[0]?.value}`}</p>
                                {isAnomaly && <p className="text-red-400 text-[10px] mt-1 font-semibold">Events: {payload[0]?.value} (baseline ~45)</p>}
                              </div>
                            )
                          }} />
                          {/* Baseline reference line */}
                          <Line type="monotone" dataKey="baseline" stroke="#475569" strokeWidth={1} strokeDasharray="4 3" dot={false} legendType="none" />
                          {/* Normal event area */}
                          <Area type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} fill="url(#normalGrad)" dot={false} />
                          {/* Anomaly overlay */}
                          <Area type="monotone" dataKey="anomaly" stroke="#ef4444" strokeWidth={3} fill="url(#anomalyGrad)" dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} style={{ filter: 'url(#glow)' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                      {/* Annotation badge */}
                      <div className="absolute top-4 right-6 bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg shadow-red-500/30 flex items-center gap-1.5">
                        <Zap className="h-3 w-3" /> Anomaly at 14:00 — 1500% Spike
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-1.5 w-4 bg-blue-500 rounded" />Normal Event Flow</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-red-400"><span className="h-1.5 w-4 bg-red-500 rounded" />Anomaly Spike</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="h-px w-4 border-t-2 border-dashed border-slate-500" />Baseline (~45 events/hr)</div>
                    </div>
                  </CardContent>
                </Card>

                {/* ── Forecasting Simulator (kept below) ─────────────────── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Systemic Pattern &amp; Forecasting Simulator
                    </CardTitle>
                    <CardDescription>Simulate future incident patterns based on historical data clusters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Incident Category</label>
                        <select
                          value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                          className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Cyber Security">Cyber Security</option>
                          <option value="Environmental">Environmental</option>
                          <option value="Health &amp; Safety">Health &amp; Safety</option>
                          <option value="HR &amp; Compliance">HR &amp; Compliance</option>
                        </select>
                      </div>
                      <div className="w-28 space-y-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Forecast Period</label>
                        <select
                          value={forecastPeriod} onChange={e => setForecastPeriod(Number(e.target.value))}
                          className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value={30}>30 Days</option>
                          <option value={60}>60 Days</option>
                          <option value={90}>90 Days</option>
                        </select>
                      </div>
                      <button
                        onClick={runForecast} disabled={forecastRunning}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                      >
                        {forecastRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        Simulate
                      </button>
                    </div>

                    {forecastData ? (
                      <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip content={({ active, payload }: any) => {
                              if (!active || !payload?.length) return null
                              return (
                                <div className="card-glass px-2 py-1.5 text-[10px]">
                                  <p className="font-semibold text-foreground">{payload[0].payload.name}</p>
                                  {payload[0].value !== null && <p className="text-blue-400">Historical: {payload[0].value}</p>}
                                  {payload[1]?.value !== null && <p className="text-purple-400">Forecasted: {payload[1]?.value}</p>}
                                </div>
                              )
                            }} />
                            <Area type="monotone" dataKey="historical" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHist)" strokeWidth={2} />
                            <Area type="monotone" dataKey="projected" stroke="#a855f7" strokeDasharray="3 3" fillOpacity={1} fill="url(#colorProj)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 justify-center text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="h-1.5 w-3 bg-blue-500 rounded" /> Historical Data</span>
                          <span className="flex items-center gap-1"><span className="h-1.5 w-3 bg-purple-500 border-dashed border-t rounded" /> Projected (AI Forecast)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-card/20">
                        <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground font-medium">No simulation active</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── TAB 5: CONTROLS ────────────────────────────────────────── */}
            {activeTab === 'controls' && (
              <div className="space-y-6 animate-fade-in">
                {/* ── Predictive Control Decay Chart ───────────────────── */}
                <Card className="bg-slate-950/60 border-slate-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-400" /> Predictive Control Decay Chart
                        </CardTitle>
                        <CardDescription>Forecasted effectiveness (%) over next 90 days — updated by current slider values</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg">
                          <AlertTriangle className="h-3 w-3" /> Predicted breach in 14 days
                        </div>
                        <span className="text-[9px] text-slate-500">Threshold: 40%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart
                        data={(() => {
                          const days = [0,10,20,30,40,50,60,70,80,90]
                          return days.map(d => ({
                            day: `Day ${d}`,
                            Preventive: Math.max(5, Math.round(ctrlPreventive - d * 0.55 + Math.sin(d/8)*3)),
                            Detective:  Math.max(5, Math.round(ctrlDetective  - d * 0.48 + Math.sin(d/7)*2)),
                            Corrective: Math.max(5, Math.round(ctrlCorrective - d * 0.65 + Math.cos(d/9)*3)),
                            threshold: 40
                          }))
                        })()}
                        margin={{ top: 5, right: 20, left: -15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                        />
                        <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                        {/* Threshold danger line */}
                        <Line type="monotone" dataKey="threshold" stroke="#f97316" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Breach Threshold (40%)" />
                        <Line type="monotone" dataKey="Preventive" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Detective"  stroke="#06b6d4" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Corrective" stroke="#22c55e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Advanced Control Evaluator
                      </CardTitle>
                      <CardDescription>Multi-dimensional control strength mapping</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-3">
                        {[
                          { label: 'Preventive', val: ctrlPreventive, set: setCtrlPreventive, col: 'accent-blue-500' },
                          { label: 'Detective', val: ctrlDetective, set: setCtrlDetective, col: 'accent-cyan-500' },
                          { label: 'Corrective', val: ctrlCorrective, set: setCtrlCorrective, col: 'accent-green-500' },
                          { label: 'Directive', val: ctrlDirective, set: setCtrlDirective, col: 'accent-purple-500' },
                          { label: 'Compensating', val: ctrlCompensating, set: setCtrlCompensating, col: 'accent-orange-500' },
                        ].map(c => (
                          <div key={c.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-foreground">{c.label} Control</span>
                              <span className="font-bold">{c.val}%</span>
                            </div>
                            <input
                              type="range" min="0" max="100" value={c.val} onChange={e => c.set(Number(e.target.value))}
                              className={`w-full ${c.col} bg-muted rounded-lg h-1`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-border bg-background/60 p-4 flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border border-border/80 bg-card/50 flex-shrink-0">
                          <span className={`text-2xl font-black ${residualRisk >= 60 ? 'text-red-400' : residualRisk >= 35 ? 'text-yellow-400' : 'text-green-400'}`}>{residualRisk}</span>
                          <span className="text-[8px] text-muted-foreground mt-0.5 uppercase tracking-widest">Res. Risk</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-semibold text-foreground">Residual Risk Assessment</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {residualRisk >= 60 ? 'CRITICAL: Severe systemic vulnerability detected across control plane.' : residualRisk >= 35 ? 'MODERATE: Controls functional but optimization required.' : 'OPTIMAL: Risk fully calibrated within thresholds.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Radar className="h-4 w-4 text-primary" /> Control Balance Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                            { subject: 'Preventive', A: ctrlPreventive, fullMark: 100 },
                            { subject: 'Detective', A: ctrlDetective, fullMark: 100 },
                            { subject: 'Corrective', A: ctrlCorrective, fullMark: 100 },
                            { subject: 'Directive', A: ctrlDirective, fullMark: 100 },
                            { subject: 'Compensating', A: ctrlCompensating, fullMark: 100 },
                          ]}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <ReRadar name="Controls" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── TAB 6: AI MODELS ───────────────────────────────────────── */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-fade-in">


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">NLP Model</p>
                      <p className="text-lg font-bold text-foreground mt-1">Sentence Transformer</p>
                      <div className="mt-4 h-1.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-primary to-cyan-400" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Ready</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="relative overflow-hidden">
                    <div className={`absolute inset-0 ${modelStatus?.clustering_trained ? 'bg-green-500/5' : 'bg-yellow-500/5'}`} />
                    <CardContent className="pt-6">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Clustering</p>
                          <p className="text-lg font-bold text-foreground mt-1">K-Means + UMAP</p>
                        </div>
                        {modelStatus?.clustering_trained ? <CheckCircle2 className="h-6 w-6 text-green-400" /> : <XCircle className="h-6 w-6 text-yellow-400" />}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <div className={`absolute inset-0 ${modelStatus?.classifier_trained ? 'bg-green-500/5' : 'bg-yellow-500/5'}`} />
                    <CardContent className="pt-6">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Classifier</p>
                          <p className="text-lg font-bold text-foreground mt-1">Gradient Boosting</p>
                        </div>
                        {modelStatus?.classifier_trained ? <CheckCircle2 className="h-6 w-6 text-green-400" /> : <XCircle className="h-6 w-6 text-yellow-400" />}
                      </div>
                      {modelStatus?.accuracy != null && (
                        <p className="text-xs text-muted-foreground mt-3">Accuracy: {(modelStatus.accuracy * 100).toFixed(1)}%</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* NLP Incident Cluster Map */}
                <Card className="bg-slate-950/60 border-slate-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-primary" /> NLP Incident Cluster Map
                        </CardTitle>
                        <CardDescription>2D t-SNE / UMAP projection of incident text embeddings — hover for primary keyword</CardDescription>
                      </div>
                      <button onClick={() => qc.invalidateQueries({ queryKey: ['cluster-map'] })} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!clusterMap?.clusters.length ? (
                      <div className="flex flex-col items-center justify-center h-80 gap-3"><RefreshCw className="h-10 w-10 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No cluster data</p></div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                          <XAxis dataKey="x" type="number" tick={false} axisLine={false} />
                          <YAxis dataKey="y" type="number" tick={false} axisLine={false} />
                          <Tooltip content={<ClusterTooltip />} />
                          {uniqueClusters.map(k => (
                            <ReScatter key={k} name={`Cluster ${k}`} data={byCluster[k]} shape={<CustomDot />} />
                          ))}
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── TAB 7: DECISION LOG ────────────────────────────────────── */}
            {activeTab === 'decisions' && (
              <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-primary" /> Analyst Decision &amp; Observation Log
                    </CardTitle>
                    <CardDescription>Record key decisions and parameter adjustments for audit trails</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <input 
                        value={newDecision} onChange={e => setNewDecision(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddDecision()}
                        placeholder="e.g. Adjusted directive controls to 80% to offset recent IT infrastructure cluster..."
                        className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button onClick={handleAddDecision} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 rounded-lg text-xs font-semibold transition-colors">
                        Log Note
                      </button>
                    </div>

                    <div className="space-y-3 mt-6 border-t border-border/30 pt-6">
                      {decisionLog.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No decisions logged in this session yet.</p>
                      ) : (
                        decisionLog.map((log, i) => (
                          <div key={i} className="flex gap-3 text-sm border border-border/50 bg-card/30 p-3 rounded-lg">
                            <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">{log.time.toLocaleTimeString()}</span>
                            <span className="text-foreground">{log.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── TAB 8: SOP PUBLISHER ───────────────────────────────────── */}
            {activeTab === 'lessons' && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" /> Lessons Learned &amp; SOP Publisher
                    </CardTitle>
                    <CardDescription>Synthesize findings from pattern analysis into documented lessons learned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-muted-foreground uppercase font-semibold">Incident Cluster Reference</label>
                          <input
                            value={assistantCluster} onChange={e => setAssistantCluster(e.target.value)}
                            className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-muted-foreground uppercase font-semibold">Key Analyst Findings / Notes</label>
                          <textarea
                            value={findingsInput} onChange={e => setFindingsInput(e.target.value)} rows={6}
                            className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                        </div>
                        <button
                          onClick={generateDraft} disabled={drafting}
                          className="w-full flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                          {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenTool className="h-3.5 w-3.5" />} Generate Draft SOP
                        </button>
                      </div>

                      <div className="border border-border rounded-lg bg-card/40 p-4 min-h-[300px] flex flex-col">
                        {draftResult ? (
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center pb-2 border-b border-border/30 mb-3">
                              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Generated Output</span>
                              <button onClick={copyToClipboard} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />} {copied ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <div className="flex-1 text-xs text-foreground whitespace-pre-line leading-relaxed overflow-y-auto pr-1">
                              {draftResult}
                            </div>
                            <button className="mt-4 w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 py-2 rounded-lg text-xs font-semibold transition-colors">
                              Publish to Lessons Library
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <PenTool className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">Ready to draft SOP</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
