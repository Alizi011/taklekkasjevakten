export interface Inquiry {
  id: string;
  createdAt: string;
  type: "akutt" | "standard" | "b2b";
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  roofType: string;
  estimatedPrice: string;
  status: "ny" | "kontaktet" | "befaring" | "fullfort";
  notes: string;
}

export const mockInquiriesData: Inquiry[] = [
  {
    id: "INQ-1001",
    createdAt: "2026-08-05 10:15",
    type: "akutt",
    customerName: "Ola Nordmann",
    phone: "912 34 567",
    email: "ola@example.no",
    address: "Storgata 12",
    city: "Oslo",
    roofType: "Flatt papirtak",
    estimatedPrice: "3 920,- / t",
    status: "ny",
    notes: "Vann renner inn gjennom taket i 3. etasje etter regnskur.",
  },
  {
    id: "INQ-1002",
    createdAt: "2026-08-04 14:30",
    type: "b2b",
    customerName: "Sameiet St. Hanshaugen (v/ Styreleder)",
    phone: "480 11 222",
    email: "styret@sameiet.no",
    address: "Ullevålsveien 45",
    city: "Oslo",
    roofType: "Flatt folietak (500m²)",
    estimatedPrice: "Rammeavtale / Tilstand",
    status: "kontaktet",
    notes: "Ønsker uavhengig tilstandsrapport og feilsøking før styremøte.",
  },
  {
    id: "INQ-1003",
    createdAt: "2026-08-03 09:00",
    type: "standard",
    customerName: "Karin Hansen",
    phone: "900 88 777",
    email: "karin@example.no",
    address: "Strandveien 8",
    city: "Bærum",
    roofType: "Skråtak m/ Takstein",
    estimatedPrice: "14 500,-",
    status: "befaring",
    notes: "Mistanke om kapillæropptrekk bak beslag ved pipe.",
  },
];