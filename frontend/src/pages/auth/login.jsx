import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  Users,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isAuthenticated, saveAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { login as loginUser } from "@/services/auth.service"

const BRAND = "#9F00FF"
const BRAND_DARK = "#7B00CC"
const BRAND_DEEP = "#5C0099"

const features = [
  { icon: Users, text: "Profile-based student tracking" },
  { icon: Fingerprint, text: "Biometric log integration" },
  { icon: BarChart3, text: "Real-time attendance analytics" },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [focusedField, setFocusedField] = useState(null)
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  })

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/admin", { replace: true })
    }
  }, [navigate])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (error) setError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const data = await loginUser({
        email: form.email,
        password: form.password,
      })

      saveAuth({
        token: data.token,
        user: data.user,
        remember: form.remember,
      })

      navigate("/admin")
    } catch (err) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid h-svh overflow-hidden lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center"
        style={{
          background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 55%, ${BRAND_DEEP} 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.18),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(92,0,153,0.55),transparent_45%)]" />
        <div className="pointer-events-none absolute top-1/4 -right-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 -left-16 size-64 rounded-full bg-[#9F00FF]/30 blur-3xl" />

        <div className="relative z-10 px-12 xl:px-20">
          <div className="mb-10 flex items-center gap-4">
            <div className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
              <Fingerprint className="size-9 text-white" />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                ATL
              </span>
              <p className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/80 uppercase ring-1 ring-white/15">
                College of Nursing — CAHS
              </p>
            </div>
          </div>

          <h1 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-5xl">
            Smart attendance for the next generation
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
            Monitor nursing student attendance with biometric logs, digital
            profiles, and live analytics — all in one secure platform.
          </p>

          <ul className="mt-10 space-y-3">
            {features.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 text-sm text-white/90"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <item.icon className="size-4" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#faf8ff]">
        <div className="pointer-events-none absolute top-0 right-0 size-80 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#9F00FF]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 size-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#9F00FF]/8 blur-3xl" />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-[#9F00FF]/90 to-[#9F00FF]/0 lg:hidden" />

        <header className="relative z-10 flex shrink-0 items-center justify-end px-6 py-5 md:px-10">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-sm">
              <Fingerprint className="size-4" />
            </div>
            <span className="text-sm font-semibold text-white">ATL</span>
          </div>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-6 pb-8 md:px-12">
          <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="mb-7">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#9F00FF] uppercase">
                Admin Portal
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div
                    className={cn(
                      "group relative rounded-2xl border bg-background transition-all duration-200",
                      focusedField === "email"
                        ? "border-[#9F00FF]/50 shadow-[0_0_0_4px_rgba(159,0,255,0.1)]"
                        : "border-border/80 shadow-sm hover:border-border"
                    )}
                  >
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#9F00FF]" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@cahs.edu.ph"
                      className="h-12 rounded-2xl border-0 bg-transparent pr-4 pl-10 shadow-none focus-visible:ring-0"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div
                    className={cn(
                      "group relative rounded-2xl border bg-background transition-all duration-200",
                      focusedField === "password"
                        ? "border-[#9F00FF]/50 shadow-[0_0_0_4px_rgba(159,0,255,0.1)]"
                        : "border-border/80 shadow-sm hover:border-border"
                    )}
                  >
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#9F00FF]" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="h-12 rounded-2xl border-0 bg-transparent pr-11 pl-10 shadow-none focus-visible:ring-0"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="remember"
                    checked={form.remember}
                    onCheckedChange={(checked) => {
                      setForm((prev) => ({ ...prev, remember: !!checked }))
                      if (error) setError("")
                    }}
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm font-normal text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-1 h-12 w-full rounded-2xl text-base font-medium text-white shadow-lg shadow-[#9F00FF]/25 hover:shadow-xl hover:shadow-[#9F00FF]/30"
                  style={{
                    background: `linear-gradient(to right, ${BRAND}, ${BRAND_DARK})`,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </form>
          </div>
        </div>
      </main>
    </div>
  )
}
