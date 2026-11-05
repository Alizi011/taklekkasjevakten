import { useEffect, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';

export type ManualInquiryPayload = {
  customer_id?: number;
  organization_number?: string;
  contact_name?: string;
  customer_name: string;
  customer_type: 'Privatperson' | 'B2B' | 'Borettslag/Sameie';
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  city: string;
  inquiry_type: '' | '' | 'lekkasjesok' | 'takkontroll' | 'reparasjon' | 'vedlikehold' | 'annet';
  notes: string;
  source: 'telefon' | 'epost' | 'direkte' | 'befaring' | 'annet';
};

export type ManualCustomerOption = {
  id: number;
  name: string;
  customer_type?: ManualInquiryPayload['customer_type'];
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void | Promise<void>;
  /** Separate authenticated ADMIN endpoint. Must not point to the public inquiries.php POST. */
  endpoint: string;
  customers?: ManualCustomerOption[];
};

const initial: ManualInquiryPayload = {
  customer_name: '', organization_number: '', contact_name: '', customer_type: 'Privatperson', phone: '', email: '',
  address: '', postal_code: '', city: '', inquiry_type: '' ,
  notes: '', source: 'telefon',
};
const field = 'w-full rounded-xl border border-[#673243] bg-[#260d18] px-3 py-2.5 text-sm text-white outline-none focus:border-rose-400';
const label = 'mb-1 block text-xs font-bold text-[#f0cbd7]';

export default function NewManualInquiryModal({ open, onClose, onCreated, endpoint, customers = [] }: Props) {
  const [form, setForm] = useState<ManualInquiryPayload>(initial);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [serverCustomers, setServerCustomers] = useState<ManualCustomerOption[]>([]);
  const [customerError, setCustomerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = <K extends keyof ManualInquiryPayload>(key: K, value: ManualInquiryPayload[K]) =>
    setForm(old => ({ ...old, [key]: value }));

  useEffect(() => {
    if (!open) return;
    function escape(e: KeyboardEvent) { if (e.key === 'Escape' && !saving) onClose(); }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open, onClose, saving]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCustomerError('');
    fetch(endpoint, { credentials: 'include', cache: 'no-store' })
      .then(async r => {
        const result = await r.json();
        if (!r.ok || !result.success || !Array.isArray(result.customers)) throw new Error(result.message || 'Kunne ikke hente kunder.');
        if (!cancelled) setServerCustomers(result.customers);
      })
      .catch(e => { if (!cancelled) setCustomerError(e instanceof Error ? e.message : 'Kunne ikke hente kunder.'); });
    return () => { cancelled = true; };
  }, [endpoint, open]);

  if (!open) return null;

  function chooseCustomer(value: string) {
    setSelectedCustomer(value);
    const customer = [...customers, ...serverCustomers].find(c => String(c.id) === value);
    if (!customer) { setForm(initial); return; }
    setForm(old => ({
      ...old,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_type: customer.customer_type || 'Privatperson',
      phone: customer.phone || '', email: customer.email || '',
      address: customer.address || '', postal_code: customer.postal_code || '',
      city: customer.city || '',
    }));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setError('');
    if (!form.customer_name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Kundenavn, telefon, adresse og sted må fylles ut.'); return;
    }
    if (form.customer_type !== 'Privatperson' && !form.contact_name?.trim()) {
      setError('Kontaktperson må fylles ut for bedrifter og sameier.'); return;
    }
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result: { success?: boolean; id?: number; inquiry_id?: number; message?: string } = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Kunne ikke opprette oppdrag.');
      const id = Number(result.inquiry_id ?? result.id);
      if (!Number.isInteger(id) || id <= 0) throw new Error('API returnerte ikke et gyldig oppdragsnummer.');
      await onCreated(id);
      setForm(initial);
      setSelectedCustomer('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil ved lagring.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="new-manual-inquiry-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#673243] bg-[#200b15] p-5 shadow-2xl md:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h2 id="new-manual-inquiry-title" className="text-2xl font-black text-white">Nytt oppdrag</h2><p className="text-sm text-[#d1abb9]">Opprett direkte i administrasjonen, uten nettskjema.</p></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Lukk" className="rounded-lg border border-[#673243] p-2 text-white"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="manual-service">Oppdragstype</label><select id="manual-service" className={field} value={form.inquiry_type} onChange={e => update('inquiry_type', e.target.value as ManualInquiryPayload['inquiry_type'])}><option value="" disabled>Velg oppdragstype</option><option value="lekkasjesok">Lekkasjesøk</option><option value="takkontroll">Takkontroll</option><option value="reparasjon">Reparasjon / utbedring</option><option value="vedlikehold">Vedlikehold</option><option value="annet">Annet</option></select></div>
            <div><label className={label} htmlFor="manual-source">Mottatt via</label><select id="manual-source" className={field} value={form.source} onChange={e => update('source', e.target.value as ManualInquiryPayload['source'])}><option value="telefon">Telefon</option><option value="epost">E-post</option><option value="direkte">Direkte kunde</option><option value="befaring">Befaring</option><option value="vedlikehold">Vedlikehold</option><option value="annet">Annet</option></select></div>
          </div>
          {customerError && <p role="alert" className="text-sm text-amber-300">{customerError}</p>}
          {([...customers, ...serverCustomers].length > 0) && <div><label className={label} htmlFor="manual-existing-customer">Eksisterende kunde</label><select id="manual-existing-customer" className={field} value={selectedCustomer} onChange={e => chooseCustomer(e.target.value)}><option value="">Ny kunde / skriv inn selv</option>{[...customers, ...serverCustomers].filter((c,i,a) => a.findIndex(x => x.id === c.id) === i).map(c => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}</select></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="manual-customer">Kunde / firmanavn *</label><input id="manual-customer" className={field} required maxLength={255} value={form.customer_name} onChange={e => update('customer_name', e.target.value)} /></div>
            <div><label className={label} htmlFor="manual-customer-type">Kundetype</label><select id="manual-customer-type" className={field} value={form.customer_type} onChange={e => update('customer_type', e.target.value as ManualInquiryPayload['customer_type'])}><option>Privatperson</option><option>B2B</option><option>Borettslag/Sameie</option></select></div>
            {form.customer_type !== 'Privatperson' && <>
              <div><label className={label} htmlFor="manual-org">Organisasjonsnummer</label><input id="manual-org" className={field} maxLength={20} value={form.organization_number || ''} onChange={e => update('organization_number', e.target.value)} /></div>
              <div><label className={label} htmlFor="manual-contact">Kontaktperson *</label><input id="manual-contact" className={field} required maxLength={255} value={form.contact_name || ''} onChange={e => update('contact_name', e.target.value)} /></div>
            </>}
            <div><label className={label} htmlFor="manual-phone">Telefon *</label><input id="manual-phone" type="tel" className={field} required maxLength={50} value={form.phone} onChange={e => update('phone', e.target.value)}/></div>
            <div><label className={label} htmlFor="manual-email">E-post</label><input id="manual-email" type="email" className={field} maxLength={255} value={form.email} onChange={e => update('email', e.target.value)}/></div>
            <div className="sm:col-span-2"><label className={label} htmlFor="manual-address">Oppdragsadresse *</label><input id="manual-address" className={field} required maxLength={255} value={form.address} onChange={e => update('address', e.target.value)}/></div>
            <div><label className={label} htmlFor="manual-postcode">Postnummer</label><input id="manual-postcode" className={field} maxLength={20} value={form.postal_code} onChange={e => update('postal_code', e.target.value)}/></div>
            <div><label className={label} htmlFor="manual-city">Sted *</label><input id="manual-city" className={field} required maxLength={100} value={form.city} onChange={e => update('city', e.target.value)}/></div>
          </div>
          <div><label className={label} htmlFor="manual-notes">Arbeidsbeskrivelse / merknader</label><textarea id="manual-notes" rows={4} className={field} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Beskriv oppdraget og hva som skal undersøkes eller utføres"/></div>
          {error && <p role="alert" className="rounded-xl border border-red-500/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-[#673243] pt-4">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-[#673243] px-5 py-2.5 text-sm font-bold text-white">Avbryt</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Plus size={17}/>{saving ? 'Lagrer…' : 'Opprett oppdrag'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
