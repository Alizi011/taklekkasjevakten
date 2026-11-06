import { useEffect, useRef, useState, type FormEvent } from "react";
import ContactModal from "./ContactModal";

const API = "https://api.taklekkasjevakten.no/api/customer_chat.php";
type ChatLink = { label: string; href: string };
type Message = { id: number; from: "visitor" | "bot"; text: string; suggestions?: string[]; links?: ChatLink[] };
const quickQuestions = ["Det drypper fra taket", "Hva koster lekkasjesøk?", "Hvorfor tilbyr dere ikke gratis befaring?", "Hvordan dokumenteres arbeidet?"];
const introduction: Message = {
  id: 0, from: "bot", text: "Hei! Jeg hjelper deg med informasjon om lekkasjesøk, priser, rapporter og våre tjenester. Vi stiller ikke diagnoser i chatten – takproblemer må undersøkes av fagfolk.", suggestions: quickQuestions,
};
export default function TlvCustomerChat() {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([introduction]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, open, busy]);
  async function ask(question: string) {
    const q = question.trim().slice(0, 300);
    if (!q || busy || turns >= 15) return;
    setTurns(t => t + 1);
    setInput(""); setError("");
    setMessages(m => [...m, { id: nextId.current++, from: "visitor", text: q }]);
    setBusy(true);
    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
      const data = await res.json();
      if (!res.ok || data.success !== true) throw new Error(data.message || "Kundehjelpen er utilgjengelig.");
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions.filter((x: unknown): x is string => typeof x === "string").slice(0, 3) : [];
      const links = Array.isArray(data.links) ? data.links.filter((x: ChatLink) => typeof x?.label === "string" && typeof x?.href === "string" && x.href.startsWith("/")) : [];
      setMessages(m => [...m, { id: nextId.current++, from: "bot", text: String(data.answer || ""), suggestions, links }]);
    } catch {
      setError("Kunne ikke hente svar akkurat nå. Du kan sende oss en henvendelse.");
    } finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void ask(input); }
  const lastId = [...messages].reverse().find(m => m.from === "bot")?.id;
  return <>
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 9000, fontFamily: "inherit", color: "#152f3e" }}>
      {!open ? <button type="button" onClick={() => setOpen(true)} aria-label="Åpne digital kundeveileder" style={{ border: 0, background: "#F5B800", color: "#162b37", padding: "14px 19px", borderRadius: 28, fontWeight: 800, boxShadow: "0 5px 28px #0005", cursor: "pointer" }}>💬 Spør oss</button> :
        <section role="dialog" aria-label="Taklekkasjevakten digital veileder" style={{ width: "min(410px, calc(100vw - 24px))", height: "min(660px, calc(100dvh - 26px))", display: "flex", flexDirection: "column", borderRadius: 18, background: "white", overflow: "hidden", boxShadow: "0 12px 45px #0007", border: "1px solid #d8e0e5" }}>
          <header style={{ background: "#142f3f", color: "white", padding: "16px 17px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div><div style={{ fontSize: 16, fontWeight: 800 }}>Taklekkasjevakten</div><div style={{ fontSize: 12, color: "#d0e0e7", marginTop: 3 }}>Digital veileder · Automatiske svar</div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Lukk kundehjelp" style={{ border: 0, background: "transparent", color: "white", fontSize: 25, cursor: "pointer" }}>×</button>
          </header>
          <div aria-live="polite" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 14, background: "#f3f6f8" }}>
            {messages.map(m => <div key={m.id} style={{ marginBottom: 15 }}>
              <div style={{ marginLeft: m.from === "visitor" ? 42 : 0, marginRight: m.from === "bot" ? 24 : 0, borderRadius: 13, background: m.from === "bot" ? "white" : "#ffedbd", padding: 13, fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap", border: "1px solid #e2e8ed" }}>{m.text}</div>
              {m.from === "bot" && m.id === lastId && !busy && <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
                {m.suggestions?.map(question => <button type="button" key={question} onClick={() => void ask(question)} disabled={turns >= 15} style={{ textAlign: "left", background: "white", color: "#203b4c", border: "1px solid #cfd9df", borderRadius: 10, padding: "10px 12px", fontSize: 12, cursor: "pointer" }}>{question} <span aria-hidden="true">›</span></button>)}
                {m.id !== 0 && <button type="button" onClick={() => setContactOpen(true)} style={{ border: 0, background: "#F5B800", color: "#172d39", padding: 11, borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Send henvendelse til oss</button>}
              </div>}
            </div>)}
            {busy && <div style={{ fontSize: 12, color: "#526a77" }}>Finner relevant informasjon …</div>}
            {error && <div role="alert" style={{ fontSize: 12, color: "#a72c36" }}>{error}<div><button type="button" onClick={() => setContactOpen(true)} style={{ textDecoration: "underline" }}>Åpne henvendelsesskjema</button></div></div>}
            <div ref={endRef} />
          </div>
          <div style={{ padding: "9px 13px", background: "#eaf0f3", color: "#476171", fontSize: 11, lineHeight: 1.5 }}>Spørsmål lagres for å forbedre informasjonen vår. Ikke del private opplysninger. <a href="/personvern" style={{ color: "#214d66", textDecoration: "underline" }}>Personvern</a></div>
          <form onSubmit={submit} style={{ display: "flex", gap: 7, padding: 11, borderTop: "1px solid #e0e7eb" }}><input aria-label="Skriv spørsmål" maxLength={300} disabled={busy || turns >= 15} placeholder={turns >= 15 ? "Maks antall spørsmål nådd" : "Skriv spørsmålet ditt …"} value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1, minWidth: 0, border: "1px solid #c9d3d8", borderRadius: 10, padding: 10, fontSize: 13, background: "white", color: "#152f3e" }} /><button type="submit" disabled={busy || !input.trim() || turns >= 15} style={{ background: "#F5B800", border: 0, padding: "10px 14px", borderRadius: 10, fontWeight: 800, color: "#142c39", cursor: "pointer", opacity: busy ? .6 : 1 }}>Send</button></form>
        </section>}
    </div>
    <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
  </>;
}
