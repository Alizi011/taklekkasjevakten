import { useEffect, useState } from "react";
import { Users, RefreshCw, X } from "lucide-react";

type Member = {
  id: number;
  full_name: string;
  access_role: string;
  status: string;
  organisation_role?: string;
};

type BoardPerson = {
  name: string;
  role: string;
  role_code: string;
};

type Props = {
  inquiryId: number;
  sessionToken: string;
  boardEndpoint: string;
  membersEndpoint: string;
  previewMode?: boolean;
  embedded?: boolean;
};

export default function CustomerBoardAccess({
  inquiryId,
  sessionToken,
  boardEndpoint,
  membersEndpoint,
  previewMode = false,
  embedded = false,
}: Props) {
  const [open, setOpen] = useState(embedded);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [board, setBoard] = useState<BoardPerson[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<BoardPerson | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // TLV_CUSTOMER_CONTACTS_V1
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSaving, setContactSaving] = useState(false);

  async function post(
    endpoint: string,
    payload: Record<string, unknown>
  ) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        inquiry_id: inquiryId,
        session_token: sessionToken,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Forespørselen feilet.");
    }

    return data;
  }

  async function load() {
    if (!sessionToken && !previewMode) {
      setError("Gyldig kundeinnlogging kreves.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [boardResult, membersResult] = await Promise.allSettled([
        previewMode
          ? fetch(boardEndpoint, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                inquiry_id: inquiryId,
                admin_preview: true,
              }),
            }).then(async (response) => {
              const data = await response.json();
              if (!response.ok || !data.success) {
                throw new Error(data.message || "Brreg-oppslaget feilet.");
              }
              return data;
            })
          : post(boardEndpoint, {}),
        previewMode ? Promise.resolve({ members: [] }) : post(membersEndpoint, { action: "list" }),
      ]);

      if (boardResult.status === "fulfilled") {
        setBoard(boardResult.value.board_members || []);
        if (previewMode) {
          setMembers(boardResult.value.members || []);
        }
      } else {
        setBoard([]);
        setError("Styreinformasjon kunne ikke hentes. Kontaktpersoner kan fortsatt vises.");
      }

      if (!previewMode) {
        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value.members || []);
        } else {
          setMembers([]);
        }
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke hente styret."
      );
    } finally {
      setLoading(false);
    }
  }

  async function registerContact() {
    if (previewMode) return;

    if (!contactName.trim() || !contactEmail.trim()) {
      setError("Navn og e-postadresse må fylles ut.");
      return;
    }

    setContactSaving(true);
    setError("");
    setMessage("");

    try {
      await post(membersEndpoint, {
        action: "add_member",
        full_name: contactName.trim(),
        organisation_role: contactRole.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        access_role: "contact_limited",
      });

      setContactName("");
      setContactRole("");
      setContactEmail("");
      setContactPhone("");
      setMessage("Kontaktpersonen er registrert. Ingen invitasjon er sendt.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke registrere kontaktpersonen."
      );
    } finally {
      setContactSaving(false);
    }
  }
  async function sendInvitation(memberId: number) {
    if (!window.confirm("Vil du sende SMS-invitasjon til dette styremedlemmet?")) {
      return;
    }

    setSendingId(memberId);
    setError("");
    setMessage("");

    try {
      const result = await post(membersEndpoint, {
        action: "send_invitation",
        member_id: memberId,
      });

      if (!result.sms_sent) {
        throw new Error("SMS-utsendelsen ble ikke bekreftet.");
      }

      setMessage("SMS-invitasjonen er sendt via STRIB.");
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke sende invitasjonen."
      );
    } finally {
      setSendingId(null);
    }
  }
  useEffect(() => {
    if (embedded) void load();
  }, [embedded, inquiryId, sessionToken]);
  async function register() {
    if (!selected || !email.trim() || !phone.trim()) {
      setError("Fyll inn e-post og mobilnummer.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await post(membersEndpoint, {
        action: "add_member",
        full_name: selected.name,
        organisation_role: selected.role,
        access_role: "board_member",
        email: email.trim(),
        phone: phone.trim(),
      });

      await post(membersEndpoint, {
        action: "prepare_invitation",
        member_id: result.member_id,
      });

      setMessage(
        "Medlemmet er registrert og klargjort. SMS er ikke sendt."
      );
      setSelected(null);
      setEmail("");
      setPhone("");
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Registreringen feilet."
      );
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={embedded ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-5" : "mb-3"}>
      {!embedded && <button
        type="button"
        onClick={() => {
          if (!open) void load();
          setOpen(!open);
        }}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-slate-900"
      >
        <Users className="h-4 w-4" />
        Personer og tilganger
      </button>}

      {open && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <strong>Personer og tilganger</strong>
            <div className="flex gap-2">
              <button type="button" onClick={() => void load()} aria-label="Oppdater">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Lukk">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading && <p>Henter opplysninger …</p>}
          {error && <p role="alert" className="mb-2 text-red-300">{error}</p>}
          {message && <p role="status" className="mb-2 text-amber-300">{message}</p>}

                    {/* TLV_CUSTOMER_PEOPLE_ACCESS_LIST_V1 */}
          <section className="mb-5 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
            <h3 className="text-sm font-bold text-white">
              Registrerte personer og tilganger
            </h3>
            <p className="mt-1 mb-4 text-xs text-slate-400">
              Personer tilknyttet dette oppdraget.
              Kontaktpersoner har ikke automatisk portaltilgang.
            </p>

            {members.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-xs text-slate-400">
                Ingen registrerte personer ble returnert for dette oppdraget.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const isContact = m.access_role === "contact_limited";
                  const roleText = isContact
                    ? "Kontaktperson"
                    : m.access_role === "customer_admin"
                    ? "Kundeadministrator"
                    : m.access_role === "board_member"
                    ? "Styremedlem"
                    : "Tilknyttet person";

                  const statusText =
                    m.status === "active"
                      ? "Aktiv"
                      : m.status === "invited"
                      ? "Invitasjon klargjort"
                      : m.status === "pending"
                      ? "Registrert"
                      : m.status;

                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-white">
                            {m.full_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {m.organisation_role || roleText}
                          </p>
                        </div>
                        <span className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                          {isContact
                            ? "Kun kontakt"
                            : statusText}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] text-slate-400">
                        {roleText}
                        {!isContact && ` · ${statusText}`}
                      </p>

                      {m.status === "invited" && !previewMode && !isContact && (
                        <button
                          type="button"
                          disabled={sendingId !== null}
                          onClick={() => void sendInvitation(m.id)}
                          className="mt-3 rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-300 disabled:opacity-50"
                        >
                          {sendingId === m.id
                            ? "Sender SMS …"
                            : "Send SMS-invitasjon"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>


          <section className="mb-5 space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Ansatte og andre kontaktpersoner
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Registrer personer prosjektansvarlig kan kontakte.
                Registrering gir ikke automatisk portaltilgang.
              </p>
            </div>

            {(
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void registerContact();
                }}
              >
                <label className="space-y-1">
                  <span>Fullt navn *</span>
                  <input
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    maxLength={255}
                    className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2"
                    placeholder="Navn"
                  />
                </label>

                <label className="space-y-1">
                  <span>Stilling eller funksjon</span>
                  <input
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2"
                    placeholder="For eksempel driftsansvarlig"
                  />
                </label>

                <label className="space-y-1">
                  <span>E-post *</span>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    maxLength={255}
                    className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2"
                    placeholder="E-postadresse"
                  />
                </label>

                <label className="space-y-1">
                  <span>Telefon</span>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    maxLength={50}
                    className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2"
                    placeholder="Telefonnummer"
                  />
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={contactSaving}
                    className="rounded-lg bg-amber-400 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-50"
                  >
                    {contactSaving ? "Registrerer …" : "Legg til kontaktperson"}
                  </button>
                </div>
              </form>
            )}

            {previewMode && (
              <p className="text-xs text-slate-400">
                Kontaktpersoner registreres av kundeadministrator i den innloggede kundeportalen. Denne forhåndsvisningen er skrivebeskyttet.
              </p>
            )}
          </section>
          {/* TLV_BOARD_COLLAPSIBLE_V1 */}
          <details className="mt-5 rounded-xl border border-slate-700 bg-slate-950/40">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-200 hover:text-amber-300">
              Vis styremedlemmer
            </summary>
            <div className="space-y-2 px-3 pb-3">
          {board.map((person, index) => {
            const existing = members.find(
              (m) =>
                m.full_name.trim().toLocaleLowerCase("nb-NO") ===
                person.name.trim().toLocaleLowerCase("nb-NO")
            );

            const status = existing?.status === "active"
              ? "Aktiv"
              : existing?.status === "invited"
              ? "Invitert"
              : existing?.status === "pending"
              ? "Registrert"
              : "Ikke invitert";

            return (
            <button
              key={`${person.name}-${index}`}
              type="button"
              onClick={() => {
                if (existing) return;
                setSelected(person);
                setError("");
              }}
              className="mb-2 block w-full rounded-lg border border-slate-700 p-2 text-left hover:border-amber-500"
            >
              <span className="block font-bold">{person.name}</span>
                            <span className="block text-slate-400">{person.role}</span>
              <span className="mt-1 block text-[11px] text-amber-300">
                {status}
              </span>
            </button>
            );
          })}

            </div>
          </details>

          {selected && (
            <div className="mt-3 border-t border-slate-700 pt-3">
              <p className="mb-2 font-bold">{selected.name}</p>

              <input
                type="email"
                aria-label="E-postadresse"
                placeholder="E-postadresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-2"
              />

              <input
                type="tel"
                aria-label="Mobilnummer"
                placeholder="Mobilnummer"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-2"
              />

              <button
                type="button"
                disabled={saving || previewMode}
                onClick={() => void register()}
                className="w-full rounded-lg bg-amber-500 p-2 font-bold text-slate-950 disabled:opacity-50"
              >
                {saving ? "Registrerer …" : "Klargjør invitasjon"}
              </button>
            </div>
          )}

          <p className="mt-3 text-[10px] text-slate-400">
            Tilgang til portalen er ikke det samme som signaturrett.
            Invitasjoner er ikke sendt via SMS.
          </p>
        </div>
      )}
    </div>
  );
}







