import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../lib/api";

type Contact = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
};

type FormData = {
  name: string;
  phone: string;
  email: string;
  role: string;
};

type Props = {
  inquiryId: number;
  onSaved?: (contact: Contact) => void;
};

const API = apiUrl("/admin_case_contact.php");

function toForm(contact: Contact | null): FormData {
  return {
    name: contact?.name ?? "",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    role: contact?.role ?? "Hovedkontakt",
  };
}

function fingerprint(form: FormData): string {
  return JSON.stringify({
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    role: form.role.trim(),
  });
}

export default function AdminCaseContactEditor({ inquiryId, onSaved }: Props) {
  const [form, setForm] = useState<FormData>(toForm(null));
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"saved" | "editing" | "saving" | "error">("saved");
  const [error, setError] = useState("");

  const savedRef = useRef("");
  const loadedRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const generationRef = useRef(0);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    let cancelled = false;
    generationRef.current += 1;
    loadedRef.current = false;

    setLoading(true);
    setError("");
    setStatus("saved");

    async function load() {
      try {
        const res = await fetch(`${API}?inquiry_id=${encodeURIComponent(inquiryId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Kunne ikke hente kontaktpersonen.");
        }

        if (cancelled) return;

        const next = toForm(data.contact ?? null);
        savedRef.current = fingerprint(next);
        setForm(next);
        loadedRef.current = true;
        setStatus("saved");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Kunne ikke hente kontaktpersonen.");
          setStatus("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      generationRef.current += 1;
    };
  }, [inquiryId]);

  useEffect(() => {
    if (loading || !loadedRef.current) return;
    const snapshot = fingerprint(form);

    if (snapshot === savedRef.current) {
      setStatus("saved");
      return;
    }

    setStatus("editing");

    const generation = generationRef.current;

    const timer = window.setTimeout(() => {
      queueRef.current = queueRef.current.catch(() => {}).then(async () => {
        if (generation !== generationRef.current || snapshot === savedRef.current) return;

        setStatus("saving");
        setError("");

        try {
          const values = JSON.parse(snapshot) as FormData;
          const res = await fetch(API, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inquiry_id: inquiryId, ...values }),
          });
          const data = await res.json();

          if (!res.ok || !data.success || !data.contact) {
            throw new Error(data.message || "Kunne ikke lagre kontaktpersonen.");
          }

          if (generation !== generationRef.current) return;

          savedRef.current = snapshot;
          onSavedRef.current?.(data.contact as Contact);

          setForm((current) => {
            if (fingerprint(current) === snapshot) setStatus("saved");
            else setStatus("editing");
            return current;
          });
        } catch (err) {
          if (generation !== generationRef.current) return;
          setError(err instanceof Error ? err.message : "Automatisk lagring mislyktes.");
          setStatus("error");
        }
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [form, inquiryId, loading]);

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400";

  const fields = [
    ["name", "Navn"],
    ["phone", "Telefon"],
    ["email", "E-post"],
    ["role", "Rolle"],
  ] as const;

  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <div>
        <h3 className="text-base font-extrabold text-white">Kontaktperson</h3>
        <p className="mt-1 text-xs text-slate-400">
          Endringer lagres automatisk. Kontaktpersonen er knyttet til denne saken.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Henter kontaktperson …</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <label key={key} className="space-y-2">
                <span className="text-xs font-bold text-slate-300">{label}</span>
                <input
                  className={inputClass}
                  type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                  maxLength={key === "name" ? 255 : key === "role" ? 100 : key === "phone" ? 50 : 255}
                  value={form[key]}
                  onChange={(e) => {
                    setForm((current) => ({ ...current, [key]: e.target.value }));
                    setStatus("editing");
                  }}
                />
              </label>
            ))}
          </div>

          <div role="status" aria-live="polite" className="text-xs font-semibold">
            {status === "saving" && <span className="text-amber-300">Lagrer …</span>}
            {status === "editing" && <span className="text-slate-400">Endringer ikke lagret ennå</span>}
            {status === "saved" && <span className="text-emerald-300">Alle endringer lagret</span>}
            {status === "error" && <span className="text-rose-300">{error || "Kunne ikke lagre."}</span>}
          </div>
        </>
      )}
    </section>
  );
}