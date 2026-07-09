import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2,
  AlertTriangle, MapPin, Building2, Tag, FileText,
  Zap, Clock, Flag, Send,
} from 'lucide-react'
import { incidentsApi } from '@/lib/api'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast }    from '@/components/ui/toaster'
import { useAuthStore } from '@/store/authStore'
import type { Severity } from '@/types'

const CATEGORIES  = ['Medication Error', 'Patient Fall', 'Surgical Complication', 'Infection Control', 'Equipment Failure', 'Diagnostic Error', 'Patient Identification', 'Documentation Error', 'Blood/Transfusion', 'Pressure Injury', 'Restraint/Elopement', 'Other']
const DEPARTMENTS = ['Emergency Department', 'ICU', 'General Ward', 'Operating Theatre', 'Pharmacy', 'Radiology', 'Laboratory', 'Maternity', 'Outpatient Clinic', 'Administration', 'Facilities & Maintenance', 'Nursing']

const SEV_OPTS = [
  { value: 'LOW',      label: 'Low — Minor issue, limited impact',           dot: 'bg-green-500',   color: 'border-green-500/30 bg-green-500/5  text-green-400' },
  { value: 'MEDIUM',   label: 'Medium — Moderate impact, needs attention',   dot: 'bg-yellow-500',  color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400' },
  { value: 'HIGH',     label: 'High — Significant impact, act soon',         dot: 'bg-orange-500',  color: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
  { value: 'CRITICAL', label: 'Critical — Severe impact, immediate action!', dot: 'bg-red-500',     color: 'border-red-500/30    bg-red-500/5    text-red-400' },
]

type Step = 1 | 2 | 'success'

export default function ReporterCreateIncidentPage() {
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()
  const user          = useAuthStore(s => s.user)
  const [step, setStep] = useState<Step>(1)

  // Step 1 fields
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [severity,    setSeverity]    = useState<Severity | ''>('')
  const [category,    setCategory]    = useState('')
  const [department,  setDepartment]  = useState('')
  const [location,    setLocation]    = useState('')

  // Step 2 fields
  const [actionTaken, setActionTaken] = useState('')
  const [priority,    setPriority]    = useState('MEDIUM')
  const [dueDate,     setDueDate]     = useState('')

  const [createdId, setCreatedId] = useState<number | null>(null)

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await incidentsApi.create({
        title, description,
        severity: severity as Severity,
        category: category || undefined,
        department: department || undefined,
        location: location || undefined,
      })
      const incidentId = res.data.data.id
      // Optionally add immediate action
      if (actionTaken.trim()) {
        await incidentsApi.addAction(incidentId, {
          actionTaken,
          priority: priority as any,
          dueDate: dueDate || undefined,
          status: 'PENDING',
        })
      }
      return incidentId
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setCreatedId(id)
      setStep('success')
    },
    onError: (err: any) => {
      toast({
        title:       'Failed to submit incident',
        description: err.response?.data?.error ?? 'Please check all fields',
        variant:     'destructive',
      })
    },
  })

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault()
    if (!title || title.length < 5) {
      toast({ title: 'Please enter a descriptive title (min 5 chars)', variant: 'destructive' }); return
    }
    if (!description || description.length < 10) {
      toast({ title: 'Please enter a detailed description (min 10 chars)', variant: 'destructive' }); return
    }
    if (!severity) {
      toast({ title: 'Please select a severity level', variant: 'destructive' }); return
    }
    setStep(2)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    createMut.mutate()
  }

  // ── Step progress indicator ───────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-3 mb-8">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            step === s
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : step === 'success' || (typeof step === 'number' && step > s)
              ? 'bg-green-500 text-white'
              : 'bg-accent text-muted-foreground border border-border'
          }`}>
            {(step === 'success' || (typeof step === 'number' && step > s)) ? (
              <CheckCircle className="h-4 w-4" />
            ) : s}
          </div>
          <span className={`text-sm font-medium hidden sm:block ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
            {s === 1 ? 'Incident Details' : 'Immediate Actions'}
          </span>
          {s < 2 && <div className={`h-px w-10 transition-all duration-300 ${(typeof step === 'number' && step > 1) || step === 'success' ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  )

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 py-16">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto animate-bounce-slow">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Zap className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Incident Submitted!</h1>
          <p className="text-muted-foreground max-w-md">
            Your incident report <span className="font-semibold text-primary">#{createdId}</span> has been successfully submitted.
            The Incident Management team will be notified and will begin processing it shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm">
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => {
            setTitle(''); setDescription(''); setSeverity(''); setCategory('')
            setDepartment(''); setLocation(''); setActionTaken(''); setPriority('MEDIUM'); setDueDate('')
            setStep(1)
          }} className="w-full">
            Report Another
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You can track the status of your report in your Dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step === 2 ? (
          <Button variant="ghost" size="icon" onClick={() => setStep(1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Report an Incident</h1>
          <p className="text-sm text-muted-foreground">
            Help us understand what happened so we can respond quickly, {user?.name.split(' ')[0]}.
          </p>
        </div>
      </div>

      <StepIndicator />

      {/* ── STEP 1: Incident Details ───────────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-5">
          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Step 1: Incident Details
              </CardTitle>
              <CardDescription>
                Describe what you witnessed or experienced. Be as detailed as possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="rep-title">
                  What happened? <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rep-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Water leak in server room, Fire alarm triggered..."
                  required
                  minLength={5}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="rep-desc">
                  Describe the incident in detail <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rep-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what you saw, when it happened, who was involved, and any immediate consequences..."
                  rows={5}
                  required
                  minLength={10}
                />
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label>
                  How serious is this? <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SEV_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeverity(opt.value as Severity)}
                      className={`p-3 rounded-lg border text-left text-xs font-medium transition-all duration-200 ${
                        severity === opt.value
                          ? `${opt.color} shadow-sm scale-[1.01]`
                          : 'border-border bg-accent/30 text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                        <span>{opt.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category + Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Tag className="h-3 w-3" /> Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="rep-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="rep-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="rep-location" className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Where did it happen?
                </Label>
                <Input
                  id="rep-location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Floor 3, Server Room B, Parking Lot..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="min-w-[160px] flex items-center gap-2">
              Next: Immediate Actions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 2: Immediate Actions ─────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Summary card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{severity} severity · {category || 'Uncategorized'} · {department || 'No department'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" /> Step 2: Immediate Actions Taken
              </CardTitle>
              <CardDescription>
                Tell us what you or others did immediately after the incident occurred. This helps the team understand the initial response.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Action Taken */}
              <div className="space-y-2">
                <Label htmlFor="rep-action">
                  What immediate action was taken? <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="rep-action"
                  value={actionTaken}
                  onChange={e => setActionTaken(e.target.value)}
                  placeholder="e.g. Evacuated the area, contacted facilities, shut down the affected system..."
                  rows={4}
                />
              </div>

              {/* Priority + Due Date */}
              {actionTaken.trim() && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Flag className="h-3 w-3" /> Priority
                    </Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="rep-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500/80" /> Low</div></SelectItem>
                        <SelectItem value="MEDIUM"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-500/80" /> Medium</div></SelectItem>
                        <SelectItem value="HIGH"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500/80" /> High</div></SelectItem>
                        <SelectItem value="URGENT"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500/80" /> Urgent</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rep-due" className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Follow-up needed by
                    </Label>
                    <Input
                      id="rep-due"
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}

              {!actionTaken.trim() && (
                <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    If no immediate action was taken, that's okay — leave this blank and just submit.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending}
              className="min-w-[180px] flex items-center gap-2 btn-glow"
            >
              {createMut.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Incident</>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
