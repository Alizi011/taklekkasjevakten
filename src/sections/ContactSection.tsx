import { useState } from "react";
import { motion } from "framer-motion";
import { Image, File, Send } from "lucide-react";
import FadeIn from "../components/FadeIn";

type ContactType = "privat" | "foretak";

export default function ContactSection() {
  const [contactType, setContactType] = useState<ContactType>("privat");
  const [formData, setFormData] = useState({
    fornavn: "",
    etternavn: "",
    epost: "",
    telefon: "",
    adresse: "",
    postnr: "",
    poststed: "",
    henvendelse: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const inputClasses =
    "w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800]/50 focus:border-[#F5B800] focus:bg-white transition-all";

  return (
    <section id="kontakt" className="section-padding bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="container-modern relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Section Header */}
          <FadeIn>
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-gold-100 text-[#B45309] text-sm font-semibold rounded-full mb-4">
                Ta Kontakt
              </span>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Kontaktskjema
              </h3>
              <p className="text-gray-500">
                Ta kontakt med oss i dag – fyll ut skjemaet og trykk på
                &rsquo;Send&rsquo;, så hører du snart fra oss!
              </p>
            </div>
          </FadeIn>

          {/* Toggle */}
          <FadeIn delay={0.1}>
            <p className="text-sm text-gray-600 text-center mb-4 font-medium">
              Er du privatperson eller representerer du et foretak?
            </p>
            <div className="flex justify-center gap-3 mb-8">
              {(["privat", "foretak"] as const).map((type) => (
                <motion.button
                  key={type}
                  onClick={() => setContactType(type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
                    contactType === type
                      ? "bg-gray-900 text-white shadow-soft"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {type === "privat" ? "Privatperson" : "Foretak"}
                </motion.button>
              ))}
            </div>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={0.2}>
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-gray-100"
            >
              <div className="space-y-3">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="fornavn"
                    placeholder="Navn"
                    value={formData.fornavn}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                  <input
                    type="text"
                    name="etternavn"
                    placeholder="Etternavn"
                    value={formData.etternavn}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    name="epost"
                    placeholder="Epost"
                    value={formData.epost}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                  <input
                    type="tel"
                    name="telefon"
                    placeholder="Telefonnummer"
                    value={formData.telefon}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>

                {/* Row 3 */}
                <input
                  type="text"
                  name="adresse"
                  placeholder="Adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  className={inputClasses}
                />

                {/* Row 4 */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="postnr"
                    placeholder="Postnr"
                    value={formData.postnr}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                  <input
                    type="text"
                    name="poststed"
                    placeholder="Poststed"
                    value={formData.poststed}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>

                {/* Row 5 */}
                <textarea
                  name="henvendelse"
                  placeholder="Din henvendelse"
                  rows={5}
                  value={formData.henvendelse}
                  onChange={handleChange}
                  className={inputClasses + " resize-none"}
                />

                {/* Upload buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-50 border border-gray-200 border-dashed rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:border-gray-300 transition-all"
                  >
                    <Image className="w-4 h-4" />
                    Last opp bilder
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-50 border border-gray-200 border-dashed rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:border-gray-300 transition-all"
                  >
                    <File className="w-4 h-4" />
                    Laste opp fil
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full gold-gradient text-white font-bold text-lg py-4 rounded-2xl shadow-gold-lg hover:shadow-gold transition-all mt-6 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </motion.button>
            </form>
          </FadeIn>

          {/* Success message */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 bg-green-50 border border-green-200 rounded-2xl text-center"
            >
              <p className="text-green-700 font-medium">
                Takk for din henvendelse! Vi kontakter deg snart.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
