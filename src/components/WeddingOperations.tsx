import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FileText, Mail, MapPin, Phone, Plus, Save, ShieldCheck, Trash2, Upload, Users, Wallet } from 'lucide-react';
import type { WeddingMoment } from '../data/wedding';
import type { WeddingDocument, WeddingDocumentType, WeddingMomentVendor, WeddingPayment, WeddingPaymentStatus, WeddingVendor } from '../data/weddingOps';
import { supabase } from '../lib/supabase';

const field = 'w-full rounded-[14px] border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink';
const categories = ['Lieu', 'Traiteur', 'Photographe', 'Vidéaste', 'DJ', 'Musicien', 'Fleuriste', 'Coiffeur / maquillage', 'Transport', 'Coordination', 'Autre'];
const documentTypes: WeddingDocumentType[] = ['devis', 'facture', 'contrat', 'assurance', 'plan', 'autre'];
const paymentStatuses: WeddingPaymentStatus[] = ['a_payer', 'partiel', 'paye'];

const emptyVendor = { name: '', category: 'Autre', contact_name: '', phone: '', email: '', website: '', address: '', arrival_time: '', departure_time: '', responsibilities: '', notes: '' };

function euros(cents: number | null | undefined) {
  return cents == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function WeddingOperations({ moments, canManage }: { moments: WeddingMoment[]; canManage: boolean }) {
  const client = supabase;
  const [vendors, setVendors] = useState<WeddingVendor[]>([]);
  const [links, setLinks] = useState<WeddingMomentVendor[]>([]);
  const [documents, setDocuments] = useState<WeddingDocument[]>([]);
  const [payments, setPayments] = useState<WeddingPayment[]>([]);
  const [vendor, setVendor] = useState(emptyVendor);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedMoment, setSelectedMoment] = useState(moments[0]?.id || '');
  const [linkRole, setLinkRole] = useState('Prestataire responsable');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<WeddingDocumentType>('devis');
  const [docVendor, setDocVendor] = useState('');
  const [docMoment, setDocMoment] = useState('');
  const [docAmount, setDocAmount] = useState('');
  const [docDue, setDocDue] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [paymentLabel, setPaymentLabel] = useState('');
  const [paymentVendor, setPaymentVendor] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDue, setPaymentDue] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<WeddingPaymentStatus>('a_payer');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!client || !canManage) return;
    const [v, l, d, p] = await Promise.all([
      client.from('wedding_vendors').select('*').order('name'),
      client.from('wedding_moment_vendors').select('*'),
      client.from('wedding_documents').select('*').order('created_at', { ascending: false }),
      client.from('wedding_payments').select('*').order('due_date'),
    ]);
    setVendors((v.data || []) as WeddingVendor[]);
    setLinks((l.data || []) as WeddingMomentVendor[]);
    setDocuments((d.data || []) as WeddingDocument[]);
    setPayments((p.data || []) as WeddingPayment[]);
  };

  useEffect(() => {
    if (!canManage) return undefined;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
    // load intentionally reads only the current Supabase client and creator scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const totalDue = useMemo(() => payments.filter((payment) => payment.status !== 'paye').reduce((sum, payment) => sum + payment.amount_cents, 0), [payments]);
  const momentVendors = links.filter((link) => link.moment_id === selectedMoment);

  if (!canManage) return null;

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setNotice('');
    try { await action(); await load(); setNotice(success); } catch (error) { setNotice(error instanceof Error ? error.message : 'Une erreur est survenue.'); }
    setBusy(false);
  };

  const addVendor = async (event: FormEvent) => {
    event.preventDefault();
    if (!vendor.name.trim() || !client) return;
    await run(async () => {
      const { error } = await client.from('wedding_vendors').insert(vendor);
      if (error) throw error;
      setVendor(emptyVendor);
    }, 'Prestataire ajouté.');
  };

  const attachVendor = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedVendor || !selectedMoment || !client) return;
    await run(async () => {
      const { error } = await client.from('wedding_moment_vendors').upsert({ moment_id: selectedMoment, vendor_id: selectedVendor, role: linkRole });
      if (error) throw error;
    }, 'Prestataire associé à ce moment.');
  };

  const addDocument = async (event: FormEvent) => {
    event.preventDefault();
    if (!docTitle.trim() || !client) return;
    await run(async () => {
      let storagePath: string | null = null;
      if (docFile) {
        storagePath = `${Date.now()}-${docFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const upload = await client.storage.from('wedding-documents').upload(storagePath, docFile, { upsert: false });
        if (upload.error) throw upload.error;
      }
      const { error } = await client.from('wedding_documents').insert({ title: docTitle.trim(), document_type: docType, vendor_id: docVendor || null, moment_id: docMoment || null, amount_cents: docAmount ? Math.round(Number(docAmount.replace(',', '.')) * 100) : null, due_date: docDue || null, storage_path: storagePath });
      if (error) throw error;
      setDocTitle(''); setDocAmount(''); setDocDue(''); setDocFile(null);
    }, 'Document enregistré dans l’espace privé.');
  };

  const addPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!paymentLabel.trim() || !client) return;
    await run(async () => {
      const { error } = await client.from('wedding_payments').insert({ label: paymentLabel.trim(), vendor_id: paymentVendor || null, amount_cents: Math.round(Number(paymentAmount.replace(',', '.') || 0) * 100), due_date: paymentDue || null, status: paymentStatus });
      if (error) throw error;
      setPaymentLabel(''); setPaymentAmount(''); setPaymentDue('');
    }, 'Paiement enregistré.');
  };

  const removeLink = async (link: WeddingMomentVendor) => {
    if (!client) return;
    await run(async () => { const { error } = await client.from('wedding_moment_vendors').delete().eq('moment_id', link.moment_id).eq('vendor_id', link.vendor_id); if (error) throw error; }, 'Association supprimée.');
  };

  const openDocument = async (document: WeddingDocument) => {
    if (!client) return;
    if (document.document_url) { window.open(document.document_url, '_blank', 'noopener,noreferrer'); return; }
    if (document.storage_path) {
      const { data, error } = await client.storage.from('wedding-documents').createSignedUrl(document.storage_path, 300);
      if (error) { setNotice(error.message); return; }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return <section className="mx-auto max-w-[1440px] px-5 pt-24 md:px-10 md:pt-32">
    <div className="rounded-[28px] bg-[#181818] p-6 text-white md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-6"><div><p className="mb-3 flex items-center gap-2 font-display text-[11px] font-semibold tracking-[0.1em] text-white/55 uppercase"><ShieldCheck className="h-4 w-4" /> Espace privé créateur</p><h2 className="font-display text-4xl font-bold tracking-[-0.05em]">Le cockpit du mariage</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Prestataires, documents et paiements associés au jour J. Rien de cette section n’est visible par les invités.</p></div><div className="flex gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/55">Prestataires</p><p className="mt-1 text-2xl font-bold">{vendors.length}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/55">Reste à payer</p><p className="mt-1 text-2xl font-bold">{euros(totalDue)}</p></div></div></div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <form onSubmit={addVendor} className="rounded-2xl bg-white/10 p-5"><h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Users className="h-4 w-4" /> Ajouter un prestataire</h3><div className="grid gap-3 sm:grid-cols-2"><input required value={vendor.name} onChange={(e) => setVendor({ ...vendor, name: e.target.value })} className={field} placeholder="Nom / entreprise" /><select value={vendor.category} onChange={(e) => setVendor({ ...vendor, category: e.target.value })} className={field}>{categories.map((category) => <option key={category}>{category}</option>)}</select><input value={vendor.contact_name} onChange={(e) => setVendor({ ...vendor, contact_name: e.target.value })} className={field} placeholder="Personne à contacter" /><input value={vendor.phone} onChange={(e) => setVendor({ ...vendor, phone: e.target.value })} className={field} placeholder="Téléphone" /><input value={vendor.email} onChange={(e) => setVendor({ ...vendor, email: e.target.value })} className={field} placeholder="Email" /><input value={vendor.address} onChange={(e) => setVendor({ ...vendor, address: e.target.value })} className={field} placeholder="Adresse" /><input value={vendor.arrival_time} onChange={(e) => setVendor({ ...vendor, arrival_time: e.target.value })} className={field} placeholder="Arrivée (ex. 14:00)" /><input value={vendor.departure_time} onChange={(e) => setVendor({ ...vendor, departure_time: e.target.value })} className={field} placeholder="Départ" /></div><textarea value={vendor.responsibilities} onChange={(e) => setVendor({ ...vendor, responsibilities: e.target.value })} className={`${field} mt-3 min-h-20`} placeholder="Missions le jour J" /><button disabled={busy} className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink uppercase"><Plus className="h-4 w-4" /> Ajouter</button></form>
        <form onSubmit={attachVendor} className="rounded-2xl bg-white/10 p-5"><h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><MapPin className="h-4 w-4" /> Relier un prestataire à un moment</h3><div className="grid gap-3 sm:grid-cols-2"><select required value={selectedMoment} onChange={(e) => setSelectedMoment(e.target.value)} className={field}>{moments.map((moment) => <option key={moment.id} value={moment.id}>{moment.time} — {moment.title}</option>)}</select><select required value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className={field}><option value="">Choisir un prestataire</option>{vendors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><input value={linkRole} onChange={(e) => setLinkRole(e.target.value)} className={`${field} mt-3`} placeholder="Rôle pour ce moment" /><button disabled={busy} className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink uppercase"><Plus className="h-4 w-4" /> Associer</button><div className="mt-5 space-y-2">{momentVendors.map((link) => { const item = vendors.find((v) => v.id === link.vendor_id); return <div key={link.vendor_id} className="flex items-center justify-between rounded-xl bg-white/10 p-3 text-sm"><span>{item?.name || 'Prestataire'} · {link.role}</span><button type="button" onClick={() => void removeLink(link)} aria-label="Supprimer l’association"><Trash2 className="h-4 w-4 text-white/60" /></button></div>; })}</div></form>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form onSubmit={addDocument} className="rounded-2xl bg-white/10 p-5"><h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><FileText className="h-4 w-4" /> Ajouter un document privé</h3><div className="grid gap-3 sm:grid-cols-2"><input required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className={field} placeholder="Titre du document" /><select value={docType} onChange={(e) => setDocType(e.target.value as WeddingDocumentType)} className={field}>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select><select value={docVendor} onChange={(e) => setDocVendor(e.target.value)} className={field}><option value="">Prestataire (optionnel)</option>{vendors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={docMoment} onChange={(e) => setDocMoment(e.target.value)} className={field}><option value="">Moment (optionnel)</option>{moments.map((moment) => <option key={moment.id} value={moment.id}>{moment.title}</option>)}</select><input value={docAmount} onChange={(e) => setDocAmount(e.target.value)} className={field} placeholder="Montant en €" /><input type="date" value={docDue} onChange={(e) => setDocDue(e.target.value)} className={field} /></div><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/30 p-3 text-sm"><Upload className="h-4 w-4" />{docFile?.name || 'Téléverser un PDF ou une image'}<input type="file" accept="application/pdf,image/*" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="hidden" /></label><button disabled={busy} className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink uppercase"><Save className="h-4 w-4" /> Enregistrer</button></form>
        <form onSubmit={addPayment} className="rounded-2xl bg-white/10 p-5"><h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Wallet className="h-4 w-4" /> Ajouter un paiement</h3><div className="grid gap-3 sm:grid-cols-2"><input required value={paymentLabel} onChange={(e) => setPaymentLabel(e.target.value)} className={field} placeholder="Libellé (acompte traiteur…)" /><select value={paymentVendor} onChange={(e) => setPaymentVendor(e.target.value)} className={field}><option value="">Prestataire (optionnel)</option>{vendors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className={field} placeholder="Montant en €" /><input type="date" value={paymentDue} onChange={(e) => setPaymentDue(e.target.value)} className={field} /><select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as WeddingPaymentStatus)} className={`${field} sm:col-span-2`}>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select></div><button disabled={busy} className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink uppercase"><Wallet className="h-4 w-4" /> Enregistrer</button></form>
      </div>
      {notice && <p className="mt-5 rounded-xl bg-white/10 p-3 text-sm text-white/75">{notice}</p>}
    </div>
    <div className="grid gap-8 py-12 lg:grid-cols-2"><div><h3 className="mb-4 font-display text-2xl font-bold">Prestataires enregistrés</h3><div className="space-y-3">{vendors.length === 0 ? <p className="text-sm text-smoke">Ajoute tes premiers prestataires ci-dessus.</p> : vendors.map((item) => <article key={item.id} className="rounded-2xl border border-line bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-smoke">{item.category}</p><h4 className="mt-1 font-display text-xl font-bold">{item.name}</h4></div><div className="flex gap-2">{item.phone && <a href={`tel:${item.phone}`} aria-label="Appeler"><Phone className="h-4 w-4" /></a>}{item.email && <a href={`mailto:${item.email}`} aria-label="Email"><Mail className="h-4 w-4" /></a>}</div></div><p className="mt-3 text-sm text-smoke">{item.responsibilities || 'Missions à préciser.'}</p><p className="mt-3 text-xs text-smoke">{item.arrival_time && `Arrivée ${item.arrival_time}`}{item.departure_time && ` · Départ ${item.departure_time}`}</p></article>)}</div></div><div><h3 className="mb-4 font-display text-2xl font-bold">Documents & paiements</h3><div className="space-y-3">{documents.map((document) => <button key={document.id} onClick={() => void openDocument(document)} className="flex w-full items-center justify-between rounded-2xl border border-line bg-white p-4 text-left"><span><span className="block font-semibold">{document.title}</span><span className="text-xs text-smoke">{document.document_type} · {document.status} · {euros(document.amount_cents)}</span></span><FileText className="h-4 w-4" /></button>)}{payments.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4"><span><span className="block font-semibold">{payment.label}</span><span className="text-xs text-smoke">{payment.status}{payment.due_date ? ` · échéance ${payment.due_date}` : ''}</span></span><span className="font-semibold">{euros(payment.amount_cents)}</span></div>)}{documents.length === 0 && payments.length === 0 && <p className="text-sm text-smoke">Aucun document ou paiement enregistré.</p>}</div></div></div>
  </section>;
}
