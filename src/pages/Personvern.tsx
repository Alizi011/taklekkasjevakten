import { Link } from "react-router-dom";

export default function Personvern() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-200">
      <article className="mx-auto max-w-3xl space-y-8">
        <Link to="/" className="text-amber-400 hover:underline">
          ← Tilbake til Taklekkasjevakten
        </Link>

        <h1 className="text-4xl font-bold text-white">
          Personvern – kundechat
        </h1>
        <p className="text-sm text-slate-400">
          Sist oppdatert: 25. oktober 2026
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            Hvem er ansvarlig?
          </h2>
          <p>
            Taklekkasjevakten er en tjeneste som drives av
            Perun AS. Perun AS er behandlingsansvarlig for
            opplysningene som behandles gjennom kundechatten.
          </p>
          <p>
            Du kan kontakte oss gjennom kontaktskjemaet
            på taklekkasjevakten.no.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            Hvilke opplysninger lagres?
          </h2>
          <p>
            Når du bruker kundechatten, registrerer vi
            spørsmålet du skriver, tidspunktet, hvilken
            kategori spørsmålet tilhører, og om systemet
            fant et standardsvar.
          </p>
          <p>
            Vi bruker også en pseudonymisert teknisk
            besøksidentifikator for å begrense misbruk.
            Identifikatoren beregnes fra IP-adressen
            med en hemmelig nøkkel og dato.
          </p>
          <p>
            Kjente mønstre for e-postadresser og
            telefonnumre forsøkes fjernet fra spørsmålene
            før lagring. Filtreringen kan ikke garantere at
            alle personopplysninger fjernes.
          </p>
          <p>
            Ikke skriv navn, adresse, telefonnummer,
            helseopplysninger eller andre private
            opplysninger i chatten.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            Hvorfor lagrer vi spørsmålene?
          </h2>
          <p>
            Vi bruker opplysningene til å besvare spørsmål,
            forbedre nettsidens informasjon, forstå hvilke
            tjenester besøkende etterspør, og identifisere
            temaer som bør forklares bedre.
          </p>
          <p>
            Innsikten kan brukes til innholdsutvikling,
            søkemotoroptimalisering og generell
            markedsplanlegging. Chatspørsmål brukes ikke
            til personlig tilpassede reklameutsendelser.
          </p>
          <p>
            Behandlingen bygger på Perun AS sine
            berettigede interesser i å tilby kundehjelp,
            forbedre informasjonen og forebygge misbruk,
            jf. GDPR artikkel 6 nr. 1 bokstav f.
            Dette forutsetter at nødvendige
            interesseavveininger er gjennomført.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            Automatiske svar
          </h2>
          <p>
            Chatten bruker forhåndsdefinerte svar og
            nøkkelord. Den bruker ikke generativ AI.
            Svarene er generell informasjon og erstatter
            ikke en faglig undersøkelse av taket.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            Lagring og sikkerhet
          </h2>
          <p>
            Chatspørsmål lagres i Taklekkasjevaktens
            database. Bare personer med tjenstlig behov
            skal ha tilgang til opplysningene.
          </p>
          <p>
            Vi har som mål å slette identifiserbare
            chatregistreringer senest etter 180 dager.
            Lagringsrutinen må være aktivert før denne
            fristen kan regnes som implementert.
          </p>
          <p>
            Tekniske driftslogger kan behandles separat
            av våre leverandører av webhotell og serverdrift.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">
            Dine rettigheter
          </h2>
          <p>
            Du kan etter gjeldende regler be om innsyn,
            retting, sletting eller begrensning av
            behandlingen, og protestere mot behandling
            basert på berettiget interesse.
          </p>
          <p>
            Kontakt Perun AS via nettsiden for å fremme
            en forespørsel. Fordi chatten ikke krever
            innlogging, kan det være begrenset mulighet
            til å knytte en registrering til en bestemt person.
          </p>
          <p>
            Du har også rett til å klage til Datatilsynet:
            {" "}
            <a
              href="https://www.datatilsynet.no"
              className="text-amber-400 underline"
            >
              datatilsynet.no
            </a>.
          </p>
        </section>

        <p className="border-t border-slate-800 pt-6 text-sm text-slate-400">
          Denne informasjonen gjelder kundechatten.
          Annen behandling av personopplysninger på
          nettstedet må beskrives separat.
        </p>
      </article>
    </main>
  );
}
