import { motion } from "framer-motion";
import FadeIn from "../components/FadeIn";

const projects = [
  {
    title: "Produksjon av Pipehatt",
    images: [
      {
        src: "/prosjekt-pipe-1.jpg",
        caption: "Før bilde: Pipe med utilstrekkelig pipehatt",
      },
      {
        src: "/prosjekt-pipe-2.jpg",
        caption: "Under arbeid: Skreddersydd pipehatt kontrollmåles",
      },
      {
        src: "/prosjekt-pipe-3.jpg",
        caption:
          "Presisjonsarbeid i praksis – hver pipehatt tilpasses individuelt for maksimal beskyttelse mot vær og fukt.",
      },
      {
        src: "/prosjekt-pipe-4.jpg",
        caption:
          "Skreddersydde pipehetter ferdig tilpasset og klare for sikker og tett installasjon.",
      },
      {
        src: "/hero-3.jpg",
        caption: "Resultat",
      },
      {
        src: "/service-flatt-tak.jpg",
        caption: "Profesjonell installasjon på stedet",
      },
    ],
  },
  {
    title: "Utbedring av Sinkkupel – Gul listet bygg",
    images: [
      {
        src: "/prosjekt-sink-1.jpg",
        caption: "Før: Skadet og rusten sinkkupel som trenger utbedring",
      },
      {
        src: "/prosjekt-sink-2.jpg",
        caption: "Under arbeid: Ny sinkkupel tilpasses og monteres",
      },
      {
        src: "/prosjekt-sink-3.jpg",
        caption: "Resultat: Ny sinkkupel ferdig montert og tett",
      },
      {
        src: "/hero-2.jpg",
        caption: "Kvalitetssikring av arbeidet",
      },
    ],
  },
];

export default function VartArbeid() {
  return (
    <div className="bg-[#111111] min-h-screen">
      {/* Header section */}
      <section className="pt-16 pb-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-[#F5B800] mb-4">
              Vårt arbeid
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4 max-w-4xl">
              Galleriet under viser et utvalg av våre tusenvis av prosjekter –
              fra avanserte lekkasjesøk til komplekse konstruksjonsutbedringer og
              skreddersydd blikkenslagerhåndverk.
            </p>
            <p className="text-gray-400 leading-relaxed mb-4 max-w-4xl">
              Det som gjør Perun AS unik, er vår tverrfaglige tyngde. Vårt team
              består av utdannede tømrere, taktekkere, blikkenslagere og
              ingeniører. Denne bredden i utdanning og erfaring gjør at vi ikke
              bare ser overflaten, men forstår hele byggets tekniske samspill.
            </p>
            <p className="text-gray-300 leading-relaxed max-w-4xl">
              Med tusenvis av løste taklekkasjer bak oss, vet vi at nøkkelen til
              et varig resultat ligger i kombinasjonen av en presis
              ingeniørfaglig diagnose og kompromissløs utførelse av faglærte
              håndverkere. Enten vi løser akutte kriser med skjult
              konstruksjonssvikt eller leverer estetiske detaljløsninger, er
              målet alltid det samme: Teknisk trygghet i generasjoner.»
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Project sections */}
      <section className="pb-20 px-4 md:px-8 space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {projects.map((project, pIndex) => (
            <FadeIn key={pIndex} delay={0.1 * pIndex}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #1a1a1a 0%, #222222 100%)",
                  boxShadow:
                    "0 0 0 2px #F5B800, 0 4px 30px rgba(245, 184, 0, 0.15)",
                }}
              >
                {/* Project title */}
                <div className="px-6 md:px-10 pt-8 pb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#F5B800]">
                    {project.title}
                  </h3>
                </div>

                {/* Image grid */}
                <div className="px-6 md:px-10 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.images.map((img, iIndex) => (
                      <motion.div
                        key={iIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          delay: 0.08 * iIndex,
                        }}
                        className="group"
                      >
                        <div className="rounded-xl overflow-hidden bg-[#1a1a1a]">
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={img.src}
                              alt={img.caption}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </div>
                          <p className="text-gray-400 text-sm px-4 py-3 leading-relaxed">
                            {img.caption}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
