import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, LogOut, Phone, ShieldCheck } from "lucide-react";
import ProjectManagerDashboard from "./ProjectManagerDashboard";
import { apiUrl } from "../lib/api";

const PROJECT_MANAGER_SESSION_KEY = "taklekkasjevakten_project_manager_session";

interface PortalEmployee {
  id: number;
  name: string;
  role: "Prosjektleder";
  email: string;
  phone: string;
  status: "Aktiv";
}

interface PortalAccessResponse {
  success: boolean;
  message?: string;
  session_token?: string;
  expires_at?: string;
  inquiry_id?: number | null;
  assigned_inquiry_ids?: number[];
  verification_id?: string;
  expires_in?: number;
  employee?: {
    id?: number | string;
    name?: string;
    role?: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
  };
}

function normalizeEmployee(
  employee: PortalAccessResponse["employee"]
): PortalEmployee | null {
  if (!employee) return null;

  const id = Number(employee.id || 0);
  const name = String(employee.name || "").trim();
  const role = String(employee.role || "").trim();
  const status = String(employee.status || "").trim();

  if (id <= 0 || !name || role !== "Prosjektleder" || status !== "Aktiv") {
    return null;
  }

  return {
    id,
    name,
    role: "Prosjektleder",
    email: String(employee.email || ""),
    phone: String(employee.phone || ""),
    status: "Aktiv",
  };
}

export default function ProjectManagerPortal() {
  const [employee, setEmployee] = useState<PortalEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [phone, setPhone] = useState("");
  const [requestingLink, setRequestingLink] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const openPortal = async () => {
      setLoading(true);
      setLoginError("");

      const magicToken = new URLSearchParams(window.location.search).get("t");
      const savedSession = window.localStorage.getItem(
        PROJECT_MANAGER_SESSION_KEY
      );

      if (!magicToken && !savedSession) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        let response: Response;

        if (magicToken) {
          response = await fetch(
            apiUrl(`/project_manager_portal.php?t=${encodeURIComponent(magicToken)}`)
          );
        } else {
          response = await fetch(apiUrl("/project_manager_portal.php"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "session",
              session_token: savedSession,
            }),
          });
        }

        const data = (await response.json()) as PortalAccessResponse;

        if (!response.ok || !data.success) {
          if (!magicToken) {
            window.localStorage.removeItem(PROJECT_MANAGER_SESSION_KEY);
          }

          if (!cancelled) {
            setLoginError(
              magicToken
                ? data.message || "Innloggingslenken er ugyldig eller utløpt."
                : ""
            );
          }
          return;
        }

        const authenticatedEmployee = normalizeEmployee(data.employee);

        if (!authenticatedEmployee) {
          window.localStorage.removeItem(PROJECT_MANAGER_SESSION_KEY);
          if (!cancelled) {
            setLoginError(
              "Denne kontoen har ikke tilgang som prosjektansvarlig."
            );
          }
          return;
        }

        if (data.session_token) {
          window.localStorage.setItem(
            PROJECT_MANAGER_SESSION_KEY,
            String(data.session_token)
          );
        }

        if (!cancelled) {
          setEmployee(authenticatedEmployee);

          if (magicToken) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (error) {
        console.error("Kunne ikke åpne prosjektportalen:", error);

        if (!magicToken) {
          window.localStorage.removeItem(PROJECT_MANAGER_SESSION_KEY);
        }

        if (!cancelled) {
          setLoginError(
            magicToken
              ? "Kunne ikke åpne den sikre innloggingslenken."
              : ""
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    openPortal();

    return () => {
      cancelled = true;
    };
  }, []);

  const requestLoginLink = async () => {

    const cleanPhone = phone.replace(/\D+/g, "");

    if (!cleanPhone) {
      setRequestMessage("");
      setLoginError("Oppgi mobilnummeret ditt.");
      return;
    }

    setRequestingLink(true);
    setLoginError("");
    setRequestMessage("");

    try {
      const response = await fetch(apiUrl("/project_manager_portal.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_login",
          phone: cleanPhone,
        }),
      });

      const data = (await response.json()) as PortalAccessResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Kunne ikke sende innloggingslenken.");
      }

      setRequestMessage(
        data.message ||
          "Hvis nummeret tilhører en aktiv prosjektansvarlig, er innloggingslenken sendt på SMS."
      );
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Kunne ikke sende innloggingslenken."
      );
    } finally {
      setRequestingLink(false);
    }
  };

  const requestSmsCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPhone = phone.replace(/\D+/g, "");
    if (!cleanPhone) {
      setLoginError("Oppgi mobilnummeret ditt.");
      return;
    }
    setCodeBusy(true);
    setLoginError("");
    setRequestMessage("");
    try {
      const response = await fetch(apiUrl("/project_manager_code_login.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_code", phone: cleanPhone }),
      });
      const data = (await response.json()) as PortalAccessResponse;
      if (!response.ok || !data.success || !data.verification_id) {
        throw new Error(data.message || "Kunne ikke bestille SMS-kode.");
      }
      setVerificationId(data.verification_id);
      setSmsCode("");
      setRequestMessage("Hvis nummeret er registrert, får du en sekssifret kode på SMS. Skriv den inn her på PC-en.");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Kunne ikke bestille SMS-kode.");
    } finally {
      setCodeBusy(false);
    }
  };

  const verifySmsCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verificationId || !/^\d{6}$/.test(smsCode) || codeBusy) return;
    setCodeBusy(true);
    setLoginError("");
    try {
      const response = await fetch(apiUrl("/project_manager_code_login.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_code",
          verification_id: verificationId,
          code: smsCode,
        }),
      });
      const data = (await response.json()) as PortalAccessResponse;
      if (!response.ok || !data.success || !data.session_token) {
        throw new Error(data.message || "Koden er ugyldig eller utløpt.");
      }
      const authenticated = normalizeEmployee(data.employee);
      if (!authenticated) {
        throw new Error("Kontoen har ikke aktiv prosjektledertilgang.");
      }
      window.localStorage.setItem(PROJECT_MANAGER_SESSION_KEY, data.session_token);
      setEmployee(authenticated);
      setVerificationId("");
      setSmsCode("");
      setRequestMessage("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Kunne ikke bekrefte koden.");
    } finally {
      setCodeBusy(false);
    }
  };

  const logout = async () => {
    const sessionToken = window.localStorage.getItem(
      PROJECT_MANAGER_SESSION_KEY
    );

    window.localStorage.removeItem(PROJECT_MANAGER_SESSION_KEY);
    setEmployee(null);
    setRequestMessage("");
    setLoginError("");

    if (!sessionToken) return;

    try {
      await fetch(apiUrl("/project_manager_portal.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "logout",
          session_token: sessionToken,
        }),
      });
    } catch (error) {
      console.error("Kunne ikke avslutte prosjektportal-sesjonen:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a11] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-[#F5B800]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <h1 className="mt-5 text-xl font-extrabold">Åpner prosjektportalen</h1>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Vi kontrollerer den sikre innloggingen.
          </p>
        </div>
      </div>
    );
  }

  if (employee) {
    return (
      <div className="relative min-h-screen bg-[#070a11]">
        <div className="fixed right-4 top-4 z-[100]">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#081321]/95 px-4 py-2.5 text-xs font-bold text-slate-200 shadow-xl backdrop-blur transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Logg ut
          </button>
        </div>

        <ProjectManagerDashboard previewEmployee={employee} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a11] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Taklekkasjevakten" className="h-11 w-auto" />
            <div>
              <p className="text-sm font-black tracking-wide">TAKLEKKASJEVAKTEN</p>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                Prosjektportal
              </p>
            </div>
          </div>

          <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-[#F5B800]">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Logg inn som prosjektansvarlig
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Oppgi mobilnummeret ditt og skriv SMS-koden inn her på PC-en.
            Du trenger ikke åpne en lenke på mobilen.
          </p>

          {loginError && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300">
              {loginError}
            </div>
          )}

          {requestMessage && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-300">
              {requestMessage}
            </div>
          )}

          {!verificationId ? (
            <form onSubmit={requestSmsCode} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-300">Mobilnummer</span>
                <div className="flex items-center rounded-xl border border-slate-700 bg-[#081321] px-3 focus-within:border-amber-500/70">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Mobilnummer"
                    required
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={codeBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {codeBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Sender …</> : "Send SMS-kode"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifySmsCode} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-300">Sekssifret SMS-kode</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={smsCode}
                  onChange={(event) => setSmsCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-700 bg-[#081321] px-4 py-3.5 text-center text-xl font-bold tracking-[0.35em] text-white outline-none focus:border-amber-500/70"
                />
              </label>
              <button
                type="submit"
                disabled={codeBusy || !/^\d{6}$/.test(smsCode)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {codeBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Kontrollerer …</> : "Bekreft kode og logg inn"}
              </button>
              <button
                type="button"
                disabled={codeBusy}
                onClick={() => {
                  setVerificationId("");
                  setSmsCode("");
                  setLoginError("");
                  setRequestMessage("");
                }}
                className="w-full rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-60"
              >
                Endre nummer eller bestill ny kode
              </button>
            </form>
          )}

          <div className="mt-5 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={requestingLink || codeBusy || !phone.trim()}
              onClick={() => void requestLoginLink()}
              className="text-xs text-slate-400 underline underline-offset-4 hover:text-white disabled:opacity-50"
            >
              {requestingLink ? "Sender innloggingslenke …" : "Bruk sikker SMS-lenke i stedet"}
            </button>
          </div>

          <p className="mt-5 text-[11px] leading-5 text-slate-500">
            Innlogging gis bare til aktive prosjektansvarlige med registrert
            mobilnummer.
          </p>
        </div>
      </div>
    </div>
  );
}