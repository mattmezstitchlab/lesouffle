export type WeddingDocumentType = 'devis' | 'facture' | 'contrat' | 'assurance' | 'plan' | 'autre';
export type WeddingDocumentStatus = 'a_verifier' | 'valide' | 'paye' | 'archive';
export type WeddingPaymentStatus = 'a_payer' | 'partiel' | 'paye';

export interface WeddingVendor {
  id: string;
  name: string;
  category: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  arrival_time: string;
  departure_time: string;
  responsibilities: string;
  notes: string;
}

export interface WeddingMomentVendor {
  moment_id: string;
  vendor_id: string;
  role: string;
  arrival_time: string;
  departure_time: string;
  notes: string;
}

export interface WeddingDocument {
  id: string;
  vendor_id: string | null;
  moment_id: string | null;
  title: string;
  document_type: WeddingDocumentType;
  storage_path: string | null;
  document_url: string | null;
  amount_cents: number | null;
  issue_date: string | null;
  due_date: string | null;
  status: WeddingDocumentStatus;
  notes: string;
}

export interface WeddingPayment {
  id: string;
  vendor_id: string | null;
  document_id: string | null;
  label: string;
  amount_cents: number;
  due_date: string | null;
  paid_at: string | null;
  method: string;
  reference: string;
  status: WeddingPaymentStatus;
  notes: string;
}
