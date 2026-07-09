import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { Label }   from '@/components/ui/label'
import { toast }   from '@/components/ui/toaster'
import { Toaster } from '@/components/ui/toaster'

export default function LoginPage() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore(s => s.setAuth)

  const [email,    setEmail]    = useState('admin@hms.com')
  const [password, setPassword] = useState('Admin@123')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      setAuth(res.data.token, res.data.user)
      toast({ title: `Welcome back, ${res.data.user.name}!`, variant: 'success' })
      navigate('/dashboard')
    } catch (err: any) {
      toast({
        title:       'Login failed',
        description: err.response?.data?.error ?? 'Please check your credentials',
        variant:     'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="w-full max-w-md px-4">
        <div className="card-glass p-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 mb-4 animate-pulse-glow">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Hospital Safety IMS</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          {/* Demo credentials hint */}
          <div className="mb-6 rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-primary">Demo:</span>{' '}
            admin@hms.com / Admin@123
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Hospital Incident Management System • AI-Powered Safety Platform
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
