import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { BrandPatternSurface } from '../components/BrandPattern';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';

export function ContactPage() {
  usePageSeo(
    'Contact',
    "Écrire à la Session Théâtre de l'UCAEP pour toute question sur le concours à l'ENSET de Lokossa.",
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
        title="Une question ?"
        italicWord="On peut en discuter."
        subtitle="Vous souhaitez obtenir une précision sur la Phase 1, votre code candidat ou l'organisation à l'ENSET de Lokossa ? Écrivez-nous directement."
      />

      <section className="relative py-16 lg:py-24 overflow-hidden">
        <BrandPatternSurface
          variant="brown"
          tileWidth={230}
          opacityClass="opacity-[0.035]"
          blendMultiply
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <EditorialMark folio="Repères" label="Sur le campus" tone="brown" />
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                Nos coordonnées
              </h2>
              <p className="text-sm sm:text-base text-ucaep-ink/75 leading-relaxed">
                Vous pouvez passer par le formulaire ci-contre ou joindre directement
                l&apos;équipe organisatrice par téléphone, par e-mail ou via nos pages @UCAEP.
              </p>
            </div>

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
            <div className="relative overflow-hidden p-8 sm:p-10 bg-white paper-fiber border border-ucaep-brown/15 rounded-sm">
              <Send
                aria-hidden="true"
                className="pointer-events-none select-none absolute -bottom-8 -right-6 w-40 h-40 text-ucaep-brown opacity-[0.04] -rotate-12"
                strokeWidth={1.1}
              />
              {status === 'sent' ? (
                <div className="relative z-10 py-12 text-center space-y-4">
                  <CheckCircle2 className="w-8 h-8 text-ucaep-green mx-auto" />
                  <h2 className="font-serif text-4xl font-semibold text-ucaep-brown">
                    C&apos;est envoyé !
                  </h2>
                  <p className="text-sm sm:text-base text-ucaep-ink/75 max-w-md mx-auto">
                    Nous avons bien reçu votre message. L&apos;équipe de l&apos;UCAEP vous
                    répondra dès que possible.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="editorial-underline text-sm font-semibold text-ucaep-brown"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                  <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                    Nous laisser un message
                  </h2>

                  {status === 'error' && (
                    <p
                      role="alert"
                      className="p-3.5 text-sm rounded-sm bg-red-50 text-red-900 border border-red-800/20"
                    >
                      {errorMsg}
                    </p>
                  )}

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
                        className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
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
                        className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/70 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] disabled:opacity-60 transition-colors"
                  >
                    <Send className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    <span>{status === 'submitting' ? 'Envoi…' : 'Envoyer'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
