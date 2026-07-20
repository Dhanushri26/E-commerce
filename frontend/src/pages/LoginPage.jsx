import { useState } from "react";
import { signIn, confirmSignIn, fetchAuthSession } from "aws-amplify/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail, ShieldCheck, ShoppingBag } from "lucide-react";

export default function LoginPage({ onLogin }) {
  const [step, setStep] = useState("LOGIN"); // "LOGIN" | "NEW_PASSWORD"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        await fetchAuthSession();
        onLogin();
        return;
      }
      if (result.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setStep("NEW_PASSWORD");
        return;
      }
    } catch (err) {
      if (err.name === "UserAlreadyAuthenticatedException") {
        await fetchAuthSession();
        onLogin();
        return;
      }
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPassword(e) {
    if (e) e.preventDefault();
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });
      if (result.isSignedIn || !result.nextStep) {
        await fetchAuthSession();
        onLogin();
      }
    } catch (err) {
      setError(err.message || "Failed to set new password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-16 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="relative z-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm mb-8">
            <ShoppingBag className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            <span className="text-indigo-300">Shop</span>Sphere
          </h1>
          <p className="mt-4 text-lg text-indigo-100 max-w-sm leading-relaxed">
            Discover millions of products across every category, delivered fast.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { title: 'Fast Delivery', desc: 'Orders shipped in 24h' },
              { title: 'Secure Payments', desc: '100% encrypted checkout' },
              { title: 'Easy Returns', desc: '30-day hassle-free policy' },
              { title: '24/7 Support', desc: 'Always here to help' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-indigo-200">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <ShoppingBag className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-slate-900">
              <span className="text-indigo-600">Shop</span>Sphere
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {step === "LOGIN" ? "Welcome back" : "Set new password"}
            </h2>
            <p className="mt-2 text-slate-500">
              {step === "LOGIN"
                ? "Sign in to your account to continue shopping."
                : "For your security, please create a new password."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={step === "LOGIN" ? handleLogin : handleNewPassword} className="space-y-4">
            {step === "LOGIN" ? (
              <motion.div
                key="login-fields"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email or Username"
                    id="login-email"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    id="login-password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="password-fields"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    id="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              id="login-submit-btn"
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {step === "LOGIN" ? "Sign In" : "Set Password"}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck size={14} className="text-indigo-400" />
            <span>Secured by AWS Cognito · 256-bit encryption</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
