export interface LocalArea {
  slug: string;
  cityName: string;
  regionName: string;
  title: string;
  description: string;
  introText: string;
  popularDistricts: string[];
  localFocusPoints: string[];
  metaTitle: string;
  metaDescription: string;
}

export const localAreasData: Record<string, LocalArea> = {
  oslo: {
    slug: "oslo",
    cityName: "Oslo",
    regionName: "Oslo & Omegn",
    title: "Taklekkasjesøk & Feilsøking i Oslo",
    description:
      "Rask utrykning og ingeniørfaglig feilsøking på tak i hele Oslo. Vi finner kilden til lekkasjen på både flate tak og skråtak uten uforholdsmessig utskifting.",
    introText:
      "Fra verneverdige bygårder i Sentrum og Frogner til moderne flate tak på Ensjø, Nydalen og eneboliger på Holmenkollen – Perun AS kjenner Oslos bygningsmasse ut og inn. Våre ingeniører og takspesialister utfører presise fagsøk i alle Oslos 15 bydeler.",
    popularDistricts: [
      "Sentrum, Frogner & Majorstuen",
      "Nordstrand, Bekkelaget & Lambertseter",
      "Groruddalen, Stovner, Alna & Furuset",
      "Ullern, Vestre Aker & Røa",
      "Grünerløkka, Sagene & Torshov",
      "Østensjø, Manglerud & Bøler",
    ],
    localFocusPoints: [
      "Spesialister på flate papp-, bitumen- og folietak i Oslo-området",
      "Uavhengige tilstandsrapporter for borettslag, sameier og forvaltere",
      "Døgnåpen akuttvakt ved plutselige fuktskader og voldsomt nedbør",
      "Ingen fordyrende mellomledd – utføres direkte av egne ingeniører",
    ],
    metaTitle: "Taklekkasje Oslo | Akutt Lekkasjesøk & Ingeniøranalyse | Perun AS",
    metaDescription:
      "Trenger du hjelp med taklekkasje i Oslo? Vi finner lekkasjekilden raskt og presist med ingeniøranalyse. Døgnåpen vakt. Ring 92 02 90 90.",
  },
  baerum: {
    slug: "baerum",
    cityName: "Bærum",
    regionName: "Vestkorridoren / Akershus",
    title: "Taklekkasjesøk & Feilsøking i Bærum",
    description:
      "Spesialister på feilsøking av taklekkasjer på eneboliger, rekkehus og næringsbygg i Bærum. Ekte håndverk og ingeniørkompetanse.",
    introText:
      "Enten du bor i en tradisjonell enebolig på Sandvika/Høvik, et nyere boligfelt på Fornebu, eller forvalter et næringsbygg på Lysaker – Perun AS hjelper deg med å lokalisere vanskelige taklekkasjer før skadene blir uforholdsmessig store.",
    popularDistricts: [
      "Sandvika, Bekkestua & Haslum",
      "Fornebu, Lysaker & Snarøya",
      "Høvik, Blommenholm & Løvik",
      "Bærums Verk, Rykkinn & Kolsås",
      "Jar, Stabekk & Hosle",
      "Tanum, Skuiterud & Vøyenenga",
    ],
    localFocusPoints: [
      "Feilsøking på krevende takkonstruksjoner og vinkeloverganger",
      "Midlertidige strakstiltak for å stoppe videre vanninntrenging umiddelbart",
      "Uavhengig skriftlig rapport for forsikrings- og eierskiftesaker",
      "Direkte fagansvar fra Perun AS – 5 års garanti ved varige utbedringer",
    ],
    metaTitle: "Taklekkasje Bærum | Feilsøking & Lekkasjesøk | Taklekkasjevakten",
    metaDescription:
      "Eksperter på feilsøking av taklekkasjer i Bærum. Sandvika, Fornebu, Bekkestua m.fl. Ingeniøranalyse uten fordyrende mellomledd. Ring oss i dag!",
  },
  asker: {
    slug: "asker",
    cityName: "Asker",
    regionName: "Vestkorridoren / Akershus",
    title: "Taklekkasjesøk & Feilsøking i Asker",
    description:
      "Profesjonelt lekkasjesøk på tak i Asker kommune. Vi finner kilden og utbedrer skaden med ingeniørpresisjon.",
    introText:
      "Klimaet i Asker byr på krevende værforhold med mye nedbør og snøsmelting. Perun AS tilbyr uavhengige fagsøk for boligeiere og sameier fra Billingstad til Hurumlandet for å avdekke skjulte lekkasjeveier bak beslag og takstein.",
    popularDistricts: [
      "Asker Sentrum, Billingstad & Nesøya",
      "Heggedal, Vollen & Blakstad",
      "Slemmestad, Nærsnes & Bødalen",
      "Røyken, Spikkestad & Midtbygda",
      "Tofte, Kana & Sætre (Hurum)",
      "Dikemark, Gullhella & Vardåsen",
    ],
    localFocusPoints: [
      "Ingeniøranalyse av kapillæropptrekk og kondensfeil i takkonstruksjon",
      "Termografering og visuelt 2-manns lekkasjesøk i felt",
      "Forebyggende taksjekk av flate tak før vintersesongen",
      "Norsk ingeniørutdanning kombinert med internasjonal takspesialitet",
    ],
    metaTitle: "Taklekkasje Asker | Ingeniørfaglig Lekkasjesøk | Perun AS",
    metaDescription:
      "Opplever du lekkasje fra taket i Asker? Våre ingeniører finner årsaken raskt. Utrykning og fagutbedring. Kontakt Taklekkasjevakten.",
  },
  lillestrom: {
    slug: "lillestrom",
    cityName: "Lillestrøm",
    regionName: "Nedre Romerike / Akershus",
    title: "Taklekkasjesøk i Lillestrøm & Omegn",
    description:
      "Rask utrykning og ingeniørfaglig feilsøking i Lillestrøm, Strømmen, Skjetten og Sørumsand.",
    introText:
      "Som et av Akershus' største knutepunkter har Lillestrøm alt fra eldre bygårder og næringsbygg til nybygde leilighetskomplekser. Perun AS rykker ut raskt for å finne årsaken til lekkasjer i hele Lillestrøm kommune.",
    popularDistricts: [
      "Lillestrøm Sentrum & Kjeller",
      "Strømmen, Skjetten & Skedsmokorset",
      "Leirsund & Frogner (Romerike)",
      "Sørumsand, Fetsund & Gan",
      "Blaker & Sørum",
    ],
    localFocusPoints: [
      "Kort utrykningstid i Lillestrøm og tilstøtende områder",
      "Spesialister på flate papp- og duk-tak på næringsbygg og leilighetsbygg",
      "Rapporter tilpasset forsikringsoppgjør, eierskifte og styremøter",
      "Ekte håndverk og ingeniørbistand uten fordyrende underleverandører",
    ],
    metaTitle: "Taklekkasje Lillestrøm | Akutt Lekkasjesøk | Perun AS",
    metaDescription:
      "Eksperter på lekkasjesøk på Lillestrøm, Strømmen og Fetsund. Vi stanser taklekkasjer og finner kilden. Ring 92 02 90 90.",
  },
  lorenskog: {
    slug: "lorenskog",
    cityName: "Lørenskog",
    regionName: "Nedre Romerike / Akershus",
    title: "Taklekkasjesøk & Feilsøking i Lørenskog",
    description:
      "Presis feilsøking av taklekkasjer på Triaden, Fjellhamar, Kurland og Robsrud.",
    introText:
      "Med sin tette boligmasse og mange borettslag/sameier har Lørenskog et stort behov for uavhengig ingeniøranalyse av tak. Perun AS hjelper både private huseiere og styrer med å identifisere fuktkilder presist.",
    popularDistricts: [
      "Fjellhamar & Hanaborg",
      "Kjenn & Solheim",
      "Kurland & Visperud",
      "Robsrud & Luhr",
      "Lørenskog Stasjon & Skårer",
    ],
    localFocusPoints: [
      "Rask responstid for beboere og forvaltere i Lørenskog",
      "Feilsøking på takterrasser, sluk og beslagsoverganger",
      "Grundige skriftlige tilstandsrapporter for styremøter",
      "Direkte fagansvar av våre egne ingeniører",
    ],
    metaTitle: "Taklekkasje Lørenskog | Feilsøking & Utrykning | Perun AS",
    metaDescription:
      "Trenger du lekkasjesøk i Lørenskog? Vi finner kilden på flate og skrå tak på Fjellhamar, Skårer m.m. Ring 92 02 90 90.",
  },
  nordrefollo: {
    slug: "nordre-follo",
    cityName: "Nordre Follo (Ski & Kolbotn)",
    regionName: "Follo / Akershus",
    title: "Taklekkasjesøk i Nordre Follo (Ski & Kolbotn)",
    description:
      "Profesjonelt lekkasjesøk i Ski, Kolbotn, Oppegård, Langhus og Greverud.",
    introText:
      "Nordre Follo kombinerer tette sentrumsområder i Ski og Kolbotn med utstrakte enebolig- og rekkehusområder. Våre ingeniører leverer presise fagsøk for alle bolig- og næringseiendommer i Nordre Follo.",
    popularDistricts: [
      "Ski Sentrum, Finstad & Kråkstad",
      "Kolbotn, Oppegård & Sofiemyr",
      "Langhus, Vevelstad & Bøleråsen",
      "Tårnåsen, Mastemyr & Greverud",
      "Siggerud & Vinterbro",
    ],
    localFocusPoints: [
      "Kort vei for utrykning i Ski og Kolbotn-området",
      "Termografering og visuelt ingeniørsøk i felt",
      "Bistand ved forsikringsskader og eierskifte",
      "5 års garanti på varige utbedringer utført av Perun AS",
    ],
    metaTitle: "Taklekkasje Ski & Kolbotn (Nordre Follo) | Lekkasjesøk | Perun AS",
    metaDescription:
      "Feilsøking av taklekkasjer i Ski, Kolbotn, Oppegård og Langhus. Vi avdekker fuktkilden presist. Kontakt Taklekkasjevakten.",
  },
  ullensaker: {
    slug: "ullensaker",
    cityName: "Ullensaker (Jessheim)",
    regionName: "Øvre Romerike / Akershus",
    title: "Taklekkasjesøk i Ullensaker & Jessheim",
    description:
      "Ingeniøranalyse og utrykning ved taklekkasjer på Jessheim, Kløfta og Gardermoen.",
    introText:
      "Gardermoen-regionen og Jessheim opplever sterk vekst. Perun AS tilbyr skreddersydde lekkasjesøk for nyere og eldre takkonstruksjoner i hele Ullensaker kommune.",
    popularDistricts: [
      "Jessheim Sentrum & Gjestad",
      "Kløfta & Borgen",
      "Gardermoen & Nordkisa",
      "Algarheim & Sand",
    ],
    localFocusPoints: [
      "Feilsøking på storbruks- og logistikktak ved Gardermoen",
      "Lokal utrykning til Jessheim, Kløfta og Romerike",
      "Uavhengige fagsøk for boligeiere, næringsliv og forvaltere",
    ],
    metaTitle: "Taklekkasje Jessheim & Ullensaker | Feilsøking på tak | Perun AS",
    metaDescription:
      "Taklekkasjesøk på Jessheim, Kløfta og Gardermoen. Rask utrykning og presis feilsøking. Ring 92 02 90 90.",
  },
  drammen: {
    slug: "drammen",
    cityName: "Drammen & Omegn",
    regionName: "Buskerud / Drammensregionen",
    title: "Taklekkasjesøk & Feilsøking i Drammen",
    description:
      "Ingeniørfaglig feilsøking av taklekkasjer i Drammen, Mjøndalen, Svelvik og Lier.",
    introText:
      "Vi rykker jevnlig ut fra Akershus/Oslo til Drammensregionen. Enten det gjelder flate tak i Drammen sentrum, eldre eneboliger på Konnerud, eller næringsbygg i Lier – Perun AS finner kilden til lekkasjen.",
    popularDistricts: [
      "Drammen Sentrum, Strømsø & Bragernes",
      "Konnerud & Åssiden",
      "Gulskogen, Fjell & Danvik",
      "Mjøndalen, Krokstadelva & Nedre Eiker",
      "Lier, Lierskogen & Tranby",
      "Svelvik & Berger",
    ],
    localFocusPoints: [
      "Utvidet dekning i Drammen, Lierbygda og omegn",
      "Spesialister på krevende vinkel- og beslagsoverganger",
      "Direkte fagansvar uten dyre mellomledd eller eksterne portaler",
    ],
    metaTitle: "Taklekkasje Drammen & Lier | Feilsøking & Lekkasjesøk | Perun AS",
    metaDescription:
      "Opplever du lekkasje fra taket i Drammen, Lier eller Mjøndalen? Våre ingeniører finner årsaken. Døgnåpen vakt 92 02 90 90.",
  },
  frogn: {
    slug: "frogn",
    cityName: "Frogn (Drøbak)",
    regionName: "Follo / Akershus",
    title: "Taklekkasjesøk i Drøbak & Frogn",
    description:
      "Presist fagsøk på verneverdige trehus, moderne eneboliger og sjønære tak i Drøbak og Frogn.",
    introText:
      "Kystklimaet i Drøbak setter høye krav til taktekking og beslag. Perun AS tilbyr spesialiserte lekkasjesøk for boligeiere og næringsbygg i hele Frogn kommune.",
    popularDistricts: [
      "Drøbak Sentrum & Gamle Drøbak",
      "Heer, Dyrløkke & Seiersten",
      "Fagerstrand-grensen & Digerud",
    ],
    localFocusPoints: [
      "Skånsom og presis feilsøking på sjarmerende kysteiendommer",
      "Termografering ved mistanke om fuktinnsiv bak beslag",
      "5 års garanti ved varige fagutbedringer",
    ],
    metaTitle: "Taklekkasje Drøbak & Frogn | Lekkasjesøk på tak | Perun AS",
    metaDescription:
      "Trenger du hjelp med taklekkasje i Drøbak eller Frogn? Vi finner kilden raskt med ingeniøranalyse. Ring 92 02 90 90.",
  },
  nesodden: {
    slug: "nesodden",
    cityName: "Nesodden",
    regionName: "Follo / Akershus",
    title: "Taklekkasjesøk på Nesodden",
    description:
      "Rask responstid for eneboliger, fritidsboliger og sameier på Nesoddtangen, Fagerstrand og Vittingsten.",
    introText:
      "Nesodden har en unik sammensetning av helårsboliger og fritidseiendommer utsatt for mye vær fra Oslofjorden. Perun AS hjelper Nesodden-beboere med å tette taket før følgeskadene oppstår.",
    popularDistricts: [
      "Nesoddtangen & Oksval",
      "Fjellstrand & Alværn",
      "Fagerstrand & Sunnaas",
    ],
    localFocusPoints: [
      "Effektiv feilsøking på værutsatte takflater",
      "Akuttvakt og midlertidige strakstiltak ved lekasje",
      "Uavhengige fagsøk av erfarne ingeniører",
    ],
    metaTitle: "Taklekkasje Nesodden | Ingeniøranalyse av tak | Perun AS",
    metaDescription:
      "Feilsøking av taklekkasjer på Nesodden (Nesoddtangen, Fjellstrand, Fagerstrand). Kontakt Taklekkasjevakten på 92 02 90 90.",
  },
  nittedal: {
    slug: "nittedal",
    cityName: "Nittedal",
    regionName: "Nedre Romerike / Akershus",
    title: "Taklekkasjesøk i Nittedal & Hakadal",
    description:
      "Profesjonelt lekkasjesøk på tak i Nittedal, Hagan, Rotnes og Hakadal.",
    introText:
      "Nittedal strekker seg langs Maridalen og Nordmarka med krevende vintre og mye snøbelastning på tak. Våre ingeniører utfører grundig feilsøking for boligeiere i hele dalen.",
    popularDistricts: [
      "Hagan & Slattum",
      "Rotnes & Nittedal Stasjon",
      "Hakadal & Åneby",
    ],
    localFocusPoints: [
      "Feilsøking av snøsmelte-lekkasjer og isdemninger",
      "Kort vei for utrykning fra Oslo og Romerike",
      "Skriftlig tilstandsrapport til forsikring/styret",
    ],
    metaTitle: "Taklekkasje Nittedal & Hakadal | Lekkasjesøk | Perun AS",
    metaDescription:
      "Feilsøking på tak i Nittedal, Hagan og Hakadal. Vi stanser taklekkasjer presist. Ring oss på 92 02 90 90.",
  },
};