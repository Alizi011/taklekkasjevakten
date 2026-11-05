import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, FileText, ListTree, RotateCcw, ShieldCheck } from "lucide-react";

/**
 * Safe, additive description organizer.
 * - Never changes the original description.
 * - No API calls, database writes, or automatic synchronization.
 * - Optional onConfirm receives a structured COPY for later integration.
 * - Parsing is deliberately lossless: blocks are slices of the source text.
 */
export interface DescriptionSection {
  id: string;
  title: string;
  originalText: string;
  start: number;
  end: number;
  kind: "heading" | "text";
}

export interface StructuredDescription {
  version: 1;
  sourceText: string;
  sections: DescriptionSection[];
}

export interface OfferWorkDescriptionEditorProps {
  originalText: string;
  onConfirm?: (result: StructuredDescription) => void;
  disabled?: boolean;
  title?: string;
}

function headingLike(value: string): boolean {
  const s = value.trim();
  if (!s || s.length > 105 || s.includes("\n")) return false;
  if (/^\d+(?:\.\d+)*[.)]?\s+\S/u.test(s)) return true;
  if (/^(?:forberedelse|reparasjon|utbedring|montering|demontering|kvalitet|forutsetninger|avgrensninger|arbeidsomfang|materialer|gjennomføring|kontroll|tilbud\s*[–-])/iu.test(s) && !/[.!?]$/.test(s)) return true;
  return false;
}

/** Split on blank lines while retaining every character, including separators. */
export function organizeDescription(sourceText: string): StructuredDescription {
  const sections: DescriptionSection[] = [];
  const pattern = /[^\r\n]+(?:\r?\n(?!\r?\n)[^\r\n]+)*(?:\r?\n)*/g;
  let match: RegExpExecArray | null;
  let lastEnd = 0;
  while ((match = pattern.exec(sourceText)) !== null) {
    const start = match.index;
    if (start > lastEnd) {
      const prefix = sourceText.slice(lastEnd, start);
      sections.push({ id: `block-${lastEnd}`, title: "Mellomrom", originalText: prefix, start: lastEnd, end: start, kind: "text" });
    }
    const text = match[0];
    const end = start + text.length;
    const stripped = text.trim();
    const kind = headingLike(stripped) ? "heading" : "text";
    sections.push({ id: `block-${start}`, title: kind === "heading" ? stripped : `Tekstblokk ${sections.length + 1}`, originalText: text, start, end, kind });
    lastEnd = end;
  }
  if (lastEnd < sourceText.length) {
    sections.push({ id: `block-${lastEnd}`, title: "Avslutning", originalText: sourceText.slice(lastEnd), start: lastEnd, end: sourceText.length, kind: "text" });
  }
  return { version: 1, sourceText, sections };
}

export function matchesOriginal(result: StructuredDescription): boolean {
  return result.sections.map((item) => item.originalText).join("") === result.sourceText;
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">{children}</div>;
}

export default function OfferWorkDescriptionEditor({
  originalText,
  onConfirm,
  disabled = false,
  title = "Strukturer arbeidsbeskrivelsen",
}: OfferWorkDescriptionEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const result = useMemo(() => organizeDescription(originalText ?? ""), [originalText]);
  const safe = useMemo(() => matchesOriginal(result), [result]);

  useEffect(() => { setConfirmed(false); }, [originalText]);

  return (
    <Panel>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-xs font-black text-white">
          <ListTree className="h-4 w-4 text-amber-300" />{title}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        Forhåndsvisning av mulig inndeling. Originalteksten og dagens lagringsflyt endres ikke.
      </p>
      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`flex items-center gap-1.5 text-[11px] ${safe ? "text-emerald-300" : "text-red-300"}`}>
              <ShieldCheck className="h-4 w-4" />
              {safe ? "Alle tegn er bevart" : "Innholdet samsvarer ikke med originalen"}
            </span>
            <button type="button" className="flex items-center gap-1 text-[11px] font-bold text-blue-300" onClick={() => setShowOriginal((value) => !value)}>
              <FileText className="h-3.5 w-3.5" />{showOriginal ? "Skjul original" : "Vis original"}
            </button>
          </div>
          {showOriginal && <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950 p-3 font-sans text-xs leading-5 text-slate-300">{originalText}</pre>}
          <div className="max-h-[420px] space-y-2 overflow-auto rounded-xl border border-slate-800 bg-[#08111d] p-3">
            {result.sections.length === 0 ? <p className="text-xs text-slate-400">Arbeidsbeskrivelsen er tom.</p> : result.sections.map((section) => (
              <div key={section.id} className={section.kind === "heading" ? "rounded-lg border-l-2 border-amber-400 bg-amber-400/5 px-3 py-2" : "px-3 py-1"}>
                <p className={`whitespace-pre-wrap break-words text-xs leading-5 ${section.kind === "heading" ? "font-bold text-white" : "text-slate-300"}`}>{section.originalText}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled || !safe || !originalText.trim() || !onConfirm}
              onClick={() => { if (safe && onConfirm) { onConfirm(result); setConfirmed(true); } }}
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Godkjenn inndeling
            </button>
            <button type="button" onClick={() => { setShowOriginal(false); setConfirmed(false); }} className="flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">
              <RotateCcw className="h-3.5 w-3.5" />Nullstill visning
            </button>
            {confirmed && <span className="text-[11px] text-emerald-300">Inndelingen er sendt til integrasjonen, ikke lagret automatisk.</span>}
          </div>
          {!onConfirm && <p className="text-[11px] text-slate-500">Forhåndsvisningsmodus: komponenten er ikke koblet til lagring ennå.</p>}
        </div>
      )}
    </Panel>
  );
}
