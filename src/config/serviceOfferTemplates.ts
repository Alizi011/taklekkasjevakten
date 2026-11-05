export type StandardService =
  | "lekkasjesok"
  | "takkontroll"
  | "service"
  | "akutt"
  | "digital";

export type StandardPricingMode = "hourly" | "fixed";

export interface StandardServiceOfferTemplate {
  service: StandardService;
  title: string;
  shortLabel: string;
  description: string;
  pricing_mode: StandardPricingMode;
  fixed_price: number | null;
  hourly_rate: number | null;
  team_rate: number | null;
  vehicle_rate: number | null;
  material_note: string;
  terms: string;
  duration_minutes?: number | null;
}

export const STANDARD_SERVICE_OFFER_TEMPLATES: Record<
  StandardService,
  StandardServiceOfferTemplate
> = {
  lekkasjesok: {
    service: "lekkasjesok",
    title: "Pristilbud – lekkasjesøk",
    shortLabel: "Lekkasjesøk",
    description:
      "Vi utfører et systematisk teknisk lekkasjesøk for å lokalisere årsaken til den registrerte lekkasjen eller fuktproblematikken.\n\n" +
      "Undersøkelsen kan omfatte utvendig kontroll av tak, beslag, sluk, gjennomføringer og overganger, samt innvendig kontroll og fuktmåling der dette er relevant.\n\n" +
      "Oppdraget utføres etter medgått tid. Endelig omfang og årsak fastslås etter teknisk undersøkelse på stedet.",
    pricing_mode: "hourly",
    fixed_price: null,
    hourly_rate: 980,
    team_rate: 1960,
    vehicle_rate: 340,
    material_note:
      "Eventuelt materiell som blir nødvendig under oppdraget faktureres i tillegg etter faktisk forbruk.",
    terms:
      "Arbeid utover beskrevet omfang avklares med kunden før utførelse. Fakturering skjer etter faktisk medgått tid og eventuelt materiell.",
  },

  takkontroll: {
    service: "takkontroll",
    title: "Pristilbud – takkontroll og inspeksjon",
    shortLabel: "Takkontroll og inspeksjon",
    description:
      "Vi utfører en systematisk kontroll av takets tekniske tilstand.\n\n" +
      "Kontrollen kan omfatte takflate, beslag, sluk, gjennomføringer, overganger og andre relevante detaljer. Formålet er å avdekke slitasje, svakheter og forhold som kan utvikle seg til lekkasjer eller andre skader.\n\n" +
      "Etter kontrollen dokumenteres relevante observasjoner og funn.",
    pricing_mode: "hourly",
    fixed_price: null,
    hourly_rate: 980,
    team_rate: 1960,
    vehicle_rate: 340,
    material_note:
      "Eventuelt materiell eller reparasjonsarbeid inngår ikke i selve kontrollen med mindre dette avtales særskilt.",
    terms:
      "Kontrollen faktureres etter faktisk medgått tid. Eventuelle anbefalte utbedringer eller videre arbeider avtales separat med kunden.",
  },

  service: {
    service: "service",
    title: "Pristilbud – servicearbeid og reparasjon",
    shortLabel: "Servicearbeid og reparasjon",
    description:
      "Vi utfører mindre servicearbeider og reparasjoner på tak og tilhørende bygningsdeler.\n\n" +
      "Dette kan blant annet omfatte tetting av kjente svakheter, mindre reparasjoner, utskifting eller justering av beslag og andre avgrensede tiltak som kan gjennomføres på stedet.\n\n" +
      "Arbeidet utføres etter medgått tid.",
    pricing_mode: "hourly",
    fixed_price: null,
    hourly_rate: 980,
    team_rate: 1960,
    vehicle_rate: 340,
    material_note:
      "Medgått materiell faktureres i tillegg etter faktisk forbruk.",
    terms:
      "Dersom det under arbeidet avdekkes behov for større eller vesentlig annet arbeid enn bestilt, avklares dette med kunden før videre utførelse.",
  },

  akutt: {
    service: "akutt",
    title: "Pristilbud – akutt utbedring",
    shortLabel: "Akutt utbedring",
    description:
      "Akutt utrykning benyttes når det er behov for rask skadebegrensning eller midlertidig sikring ved aktiv lekkasje eller annen akutt situasjon.\n\n" +
      "Teamet vurderer situasjonen på stedet og gjennomfører nødvendige, forsvarlige strakstiltak innenfor det som praktisk kan utføres ved utrykningen.\n\n" +
      "Eventuell permanent utbedring utover akutt skadebegrensning avtales separat.",
    pricing_mode: "hourly",
    fixed_price: null,
    hourly_rate: null,
    team_rate: 3920,
    vehicle_rate: 340,
    material_note:
      "Medgått materiell faktureres i tillegg etter faktisk forbruk.",
    terms:
      "Akutt utrykning faktureres etter faktisk medgått tid. Større eller permanent utbedring avtales separat dersom dette ikke kan utføres som del av akuttoppdraget.",
  },

  digital: {
    service: "digital",
    title: "Digital konsultasjon – videomøte",
    shortLabel: "Digital konsultasjon",
    description:
      "Digital konsultasjon med prosjektansvarlig / daglig leder via videomøte.\n\n" +
      "Kunden kan vise problemområdet, bilder, dokumentasjon og relevante bygningsdetaljer under samtalen. Formålet er å gi en innledende faglig vurdering og avklare eventuell videre oppfølging.",
    pricing_mode: "fixed",
    fixed_price: 1490,
    hourly_rate: null,
    team_rate: null,
    vehicle_rate: null,
    material_note: "",
    terms:
      "Fastprisen gjelder ett digitalt videomøte på inntil 45 minutter. Eventuell fysisk undersøkelse, lekkasjesøk, service eller annet videre arbeid avtales og prises separat.",
    duration_minutes: 45,
  },
};

export function isStandardService(
  value?: string | null
): value is StandardService {
  return (
    value === "lekkasjesok" ||
    value === "takkontroll" ||
    value === "service" ||
    value === "akutt" ||
    value === "digital"
  );
}

export function getStandardServiceOfferTemplate(
  value?: string | null
): StandardServiceOfferTemplate | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!isStandardService(normalized)) {
    return null;
  }

  return STANDARD_SERVICE_OFFER_TEMPLATES[normalized];
}

export function buildStandardOfferPayload(
  inquiryId: number,
  service: StandardService,
  createdBy?: string | null,
  autoPublish = false
) {
  const template = STANDARD_SERVICE_OFFER_TEMPLATES[service];

  return {
    inquiry_id: inquiryId,
    service: template.service,
    title: template.title,
    description: template.description,
    pricing_mode: template.pricing_mode,
    fixed_price: template.fixed_price,
    hourly_rate: template.hourly_rate,
    team_rate: template.team_rate,
    vehicle_rate: template.vehicle_rate,
    material_note: template.material_note,
    terms: template.terms,
    offer_context: "initial",
    created_by_name: createdBy || "Prosjektansvarlig",
    auto_publish: autoPublish,
  };
}
