import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Brain, AlertCircle, BookOpen, Sparkles, HelpCircle } from 'lucide-react'
import { incidentsApi, aiApi, usersApi } from '@/lib/api'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast }    from '@/components/ui/toaster'
import type { RiskPrediction, Severity } from '@/types'

const CATEGORIES  = ['Medication Error', 'Patient Fall', 'Surgical Complication', 'Infection Control', 'Equipment Failure', 'Diagnostic Error', 'Patient Identification', 'Documentation Error', 'Blood/Transfusion', 'Pressure Injury', 'Restraint/Elopement', 'Other']
const DEPARTMENTS = ['Emergency Department', 'ICU', 'General Ward', 'Operating Theatre', 'Pharmacy', 'Radiology', 'Laboratory', 'Maternity', 'Outpatient Clinic', 'Administration', 'Facilities & Maintenance', 'Nursing']

export default function CreateIncidentPage() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [severity,    setSeverity]    = useState('')
  const [category,    setCategory]    = useState('')
  const [department,  setDepartment]  = useState('')
  const [location,    setLocation]    = useState('')
  const [riskPreview, setRiskPreview] = useState<RiskPrediction | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)


  const [recommendations, setRecommendations] = useState<any[]>([])
  const [recLoading, setRecLoading] = useState(false)

  // Live Lessons Learned Recommendations (Debounced)
  useEffect(() => {
    if (title.length < 5 && description.length < 10) {
      setRecommendations([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setRecLoading(true)
      try {
        const res = await aiApi.recommendLessons({ title, description, category, department })
        setRecommendations(res.data.recommendations || [])
      } catch (err) {
        console.error('Failed to fetch recommendations', err)
      } finally {
        setRecLoading(false)
      }
    }, 800) // 800ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [title, description, category, department])

  const createMut = useMutation({
    mutationFn: () => incidentsApi.create({
      title,
      description,
      severity: severity as Severity,
      category,
      department,
      location,
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast({ title: 'Incident created successfully!', variant: 'success' })
      navigate(`/incidents/${res.data.data.id}`)
    },
    onError: (err: any) => {
      toast({
        title:       'Failed to create incident',
        description: err.response?.data?.error ?? 'Please check all fields',
        variant:     'destructive',
      })
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!severity) { toast({ title: 'Please select a severity level', variant: 'destructive' }); return }
    createMut.mutate()
  }

  const handleAIPreview = async () => {
    if (!title || !description) {
      toast({ title: 'Enter title and description first', variant: 'destructive' })
      return
    }
    setRiskLoading(true)
    try {
      const res = await aiApi.predictRisk({ title, description, category, department })
      setRiskPreview(res.data)
    } catch {
      toast({ title: 'AI service unavailable', description: 'Risk preview not available', variant: 'destructive' })
    } finally {
      setRiskLoading(false)
    }
  }

  const riskColor = riskPreview
    ? riskPreview.risk_score >= 75 ? 'text-red-400'
    : riskPreview.risk_score >= 50 ? 'text-orange-400'
    : riskPreview.risk_score >= 25 ? 'text-yellow-400'
    : 'text-green-400'
    : ''

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Report New Clinical Incident</h1>
          <p className="text-sm text-muted-foreground">Fill in the details to log a new incident</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Main details */}
          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Brief, descriptive incident title"
                  required minLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what happened, when it occurred, and its immediate impact..."
                  rows={6}
                  required minLength={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity <span className="text-destructive">*</span></Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500/80" /> Low</div></SelectItem>
                      <SelectItem value="MEDIUM"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-500/80" /> Medium</div></SelectItem>
                      <SelectItem value="HIGH"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500/80" /> High</div></SelectItem>
                      <SelectItem value="CRITICAL"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500/80" /> Critical</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Ward 3B, Bed 12, ICU Bay 4"
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMut.isPending} className="min-w-[160px]">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Incident'}
            </Button>
          </div>
        </form>

        {/* Right column: AI recommendations & preview */}
        <div className="space-y-6">
          {/* AI Risk Preview */}
          <Card className="border-primary/20 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> AI Risk Preview
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {riskPreview ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg bg-accent/30 border border-border/40">
                    <p className={`text-2xl font-bold ${riskColor}`}>
                      {riskPreview.risk_score.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Risk Score</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/30 border border-border/40">
                    <p className={`text-sm font-bold truncate ${riskColor}`}>{riskPreview.risk_label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Severity</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/30 border border-border/40">
                    <p className="text-sm font-bold text-foreground">
                      {(riskPreview.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Confidence</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-accent/30 p-3 text-xs text-muted-foreground border border-border/30">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Click to predict severity & assess risk before submitting.
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={handleAIPreview} disabled={riskLoading} className="w-full text-xs">
                {riskLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Brain className="h-3.5 w-3.5 mr-1.5" />}
                {riskLoading ? 'Analysing...' : 'Get AI Risk Prediction'}
              </Button>
            </CardContent>
          </Card>

          {/* AI Lessons Learned Recommendations */}
          <Card className="border-emerald-500/20 bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                AI Solutions & Lessons
              </CardTitle>
              <CardDescription className="text-xs">
                Matches current draft details with solutions from historical incidents.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 max-h-[450px] overflow-y-auto">
              {recLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                  <span className="text-xs">Searching library...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors duration-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-300 line-clamp-1 leading-snug">
                          {rec.title}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-semibold text-emerald-400 border-emerald-500/30 bg-emerald-500/10 whitespace-nowrap">
                          {Math.round(rec.similarity_score * 100)}% Match
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {rec.lessons_learned}
                      </p>
                      {rec.category && (
                        <div className="flex gap-1.5">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Category: {rec.category}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                  <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-xs font-medium max-w-[200px]">
                    {title.length < 5 && description.length < 10
                      ? 'Type a title and description to fetch AI recommendations.'
                      : 'No similar lessons learned found in history.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
