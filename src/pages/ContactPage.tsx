import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BrandPatternSurface } from '../components/BrandPattern';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { EditorialReveal, EditorialTitleReveal } from '../components/MotionPrimitives';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';
import { EDITORIAL_EASE, TACTILE_SPRING } from '../lib/motion';

export function ContactPage() {
  usePageSeo(
    'Contact',
    "Contacter la Session Théâtre de l'UCAEP pour toute question sur l'inscription, les épreuves ou l'organisation à l'ENSET de Lokossa.",
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const data = await fetchApiJson<{ saved: boolean }>('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!data.saved) {
        throw new Error("Votre message n'a pas pu être envoyé pour le moment.");
      }
      setStatus('sent');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Votre message n'a pas pu être envoyé pour le moment.",
      );
    }
  }

  return (
    <div className="bg-ucaep-paper">
      <PageFolioHeader
        folio="Correspondance"
        section="Session Théâtre · UCAEP"
        title="Contacter"
        italicWord="l'organisation."
        subtitle="Une question sur l'inscription, votre code d'anonymat, le dépôt des productions en ligne ou le déroulement du concours à l'ENSET de Lokossa ? Adressez votre message à l'équipe organisatrice."
        quickFacts={[
          { label: 'Équipe', value: 'Session Théâtre UCAEP' },
          { label: 'Campus', value: 'ENSET Lokossa' },
          { label: 'E-mail', value: 'ucaeplokossa@gmail.com' },
          { label: 'Réseaux', value: '@UCAEP' },
        ]}
      />

      <section className="relative py-16 lg:py-24 overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={230}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-8">
            <EditorialReveal className="space-y-3">
              <EditorialMark folio="Repères" label="Sur le campus" tone="brown" />
              <EditorialTitleReveal>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                  Nos coordonnées
                </h2>
              </EditorialTitleReveal>
              <p className="text-sm sm:text-base text-ucaep-ink/78 leading-relaxed max-w-prose">
                Si vous êtes déjà inscrit et que votre demande concerne votre dossier, précisez votre code d&apos;anonymat{' '}
                <span className="font-mono font-semibold text-ucaep-brown">UCAEP-2026-XXXX</span>{' '}
                dans votre message : l&apos;équipe de la Session Théâtre pourra vous répondre plus rapidement.
              </p>
            </EditorialReveal>

            <dl className="divide-y divide-ucaep-brown/14 border-t border-b border-ucaep-brown/14 text-sm">
              <div className="py-5">
                <dt className="text-xs font-semibold uppercase tracking-widest text-ucaep-brown/70">
                  Qui organise ?
                </dt>
                <dd className="mt-1.5 font-serif text-xl font-semibold text-ucaep-ink">
                  Session Théâtre de l&apos;UCAEP — Union Culturelle et Artistique des Élèves-Professeurs
                </dd>
                <dd className="mt-1 text-xs text-ucaep-brown/75">
                  Devise : Créer · Transmettre · Rayonner
                </dd>
              </div>

              <div className="py-5">
                <dt className="text-xs font-semibold uppercase tracking-widest text-ucaep-brown/70">
                  Téléphones &amp; e-mail
                </dt>
                <dd className="mt-2.5 space-y-2.5 text-ucaep-ink">
                  <a
                    href="tel:+2290168624600"
                    className="flex items-center gap-2.5 hover:text-ucaep-brown tabular-nums"
                  >
                    <Phone className="w-4 h-4 text-ucaep-gold shrink-0" />
                    <span className="editorial-underline">+229 01 68 62 46 00</span>
                  </a>
                  <a
                    href="tel:+2290196118037"
                    className="flex items-center gap-2.5 hover:text-ucaep-brown tabular-nums"
                  >
                    <Phone className="w-4 h-4 text-ucaep-gold shrink-0" />
                    <span className="editorial-underline">+229 01 96 11 80 37</span>
                  </a>
                  <a
                    href="mailto:ucaeplokossa@gmail.com"
                    className="flex items-center gap-2.5 hover:text-ucaep-brown"
                  >
                    <Mail className="w-4 h-4 text-ucaep-gold shrink-0" />
                    <span className="editorial-underline">ucaeplokossa@gmail.com</span>
                  </a>
                </dd>
              </div>

              <div className="py-5">
                <dt className="text-xs font-semibold uppercase tracking-widest text-ucaep-brown/70">
                  Campus &amp; réseaux sociaux
                </dt>
                <dd className="mt-2 space-y-2 text-ucaep-ink">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-ucaep-gold shrink-0 mt-0.5" />
                    <span>
                      ENSET de Lokossa — UNSTIM
                      <br />
                      Lokossa, Département du Mono, Bénin
                    </span>
                  </div>
                  <p className="text-xs text-ucaep-brown/75 pl-6">
                    Facebook · Instagram · YouTube : @UCAEP
                  </p>
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <div className="art-card relative overflow-hidden p-8 sm:p-10 bg-white paper-fiber border border-ucaep-brown/15 rounded-[2px]">
              <Send
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-8 -right-6 w-40 h-40 text-ucaep-brown opacity-[0.04] -rotate-12"
                strokeWidth={1.1}
              />
              <AnimatePresence mode="wait">
                {status === 'sent' ? (
                  <motion.div
                    key="contact-sent"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                    className="relative z-10 py-12 text-center space-y-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-ucaep-green mx-auto" />
                    <h2 className="font-serif text-4xl font-semibold text-ucaep-brown">
                      Message transmis
                    </h2>
                    <p className="text-sm sm:text-base text-ucaep-ink/75 max-w-md mx-auto">
                      Votre message a bien été enregistré. Un membre de l&apos;équipe UCAEP vous
                      répondra dans les meilleurs délais.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="editorial-underline text-sm font-semibold text-ucaep-brown"
                    >
                      Envoyer un autre message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="contact-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
                    onSubmit={handleSubmit}
                    className="relative z-10 space-y-6"
                  >
                    <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                      Nous laisser un message
                    </h2>

                    <AnimatePresence mode="wait">
                      {status === 'error' && (
                        <motion.p
                          key={errorMsg}
                          role="alert"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                          className="p-3.5 text-sm rounded-[2px] bg-red-50 text-red-900 border border-red-800/20"
                        >
                          {errorMsg}
                        </motion.p>
                      )}
                    </AnimatePresence>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                      >
                        Nom et prénom
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-[2px] focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                      >
                        Adresse e-mail
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-[2px] focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                    >
                      Sujet
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-[2px] focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                    >
                      Votre message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-[2px] focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      transition={TACTILE_SPRING}
                      disabled={status === 'submitting'}
                      className="btn-tactile group inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c] disabled:opacity-60"
                    >
                      <Send className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      <span>{status === 'submitting' ? 'Envoi en cours…' : 'Envoyer le message'}</span>
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
