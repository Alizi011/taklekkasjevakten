import { useState } from "react";
import type { FormEvent } from "react";
import { Lock, ShieldCheck } from "lucide-react";

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === "perun2026" || password === "admin") {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[#F5B800] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Taklekkasjevakten</h1>
          <p className="text-xs text-amber-500 font-bold mt-1">Admin Portal — Perun AS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Passord
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Skriv inn admin-passord"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors pl-10"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-2 font-semibold">Feil passord. Prøv igjen.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#F5B800] hover:bg-[#e0a800] text-slate-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg cursor-pointer"
          >
            Logg inn på kontrollpanel
          </button>
        </form>
      </div>
    </div>
  );
}