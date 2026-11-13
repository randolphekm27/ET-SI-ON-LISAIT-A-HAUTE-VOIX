import { useState, type FormEvent } from 'react';
import { CheckCircle2, MapPin, Send } from 'lucide-react';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';

export function ContactPage() {
  usePageSeo(
    'Contact',
    "Contacter le comité d'organisation UCAEP du concours à l'ENSET de Lokossa.",
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
        throw new Error("Impossible d'envoyer votre message.");
      }
      setStatus('sent');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : "Impossible d'envoyer votre message.",
      );
    }
  }

  return (
    <div className="bg-[#FBF9F5]">
      <section className="py-16 lg:py-24 border-b border-[#4E2A1E]/12 paper-grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
            Organisation · UCAEP
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#4E2A1E]">
            Contacter l&apos;équipe
          </h1>
          <p className="text-base sm:text-lg text-[#1A1A1A]/80 max-w-xl">
            Une question sur votre candidature ou le déroulement du concours à l&apos;ENSET
            de Lokossa ?
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <h2 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                Repères officiels
              </h2>
              <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                Le comité d&apos;organisation reçoit vos messages via le formulaire
                officiel et assure le suivi auprès des étudiants sur le campus.
              </p>
            </div>

            <dl className="space-y-6 border-t border-[#4E2A1E]/15 pt-6 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]/75">
                  Organisateur
                </dt>
                <dd className="mt-1 font-medium text-[#1A1A1A]">
                  UCAEP — Comité d&apos;organisation du concours « Et si on lisait à haute
                  voix ? »
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]/75">
                  Localisation
                </dt>
                <dd className="mt-1 flex items-start gap-2 text-[#1A1A1A]">
                  <MapPin className="w-4 h-4 text-[#D19A3A] shrink-0 mt-0.5" />
                  <span>
                    Campus de l&apos;ENSET de Lokossa
                    <br />
                    Lokossa, Département du Mono, Bénin
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]/75">
                  Canaux campus &amp; réseaux
                </dt>
                <dd className="mt-1 text-[#1A1A1A]/80 leading-relaxed">
                  Les liens vers les canaux numériques officiels de l&apos;UCAEP sont
                  relayés auprès des étudiants sur les panneaux du campus et dans la
                  rubrique Annonces.
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 bg-white border border-[#4E2A1E]/15 rounded-sm">
              {status === 'sent' ? (
                <div className="py-10 text-center space-y-4">
                  <CheckCircle2 className="w-8 h-8 text-[#2E4D32] mx-auto" />
                  <h2 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                    Message transmis
                  </h2>
                  <p className="text-sm text-[#1A1A1A]/75 max-w-md mx-auto">
                    Votre message a bien été enregistré pour le comité UCAEP.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="text-sm font-semibold text-[#4E2A1E] underline"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                    Écrire un message
                  </h2>

                  {status === 'error' && (
                    <p
                      role="alert"
                      className="p-3 text-sm rounded-sm bg-red-50 text-red-900 border border-red-800/20"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                      >
                        Nom complet
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                      >
                        Adresse e-mail
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                    >
                      Objet
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] disabled:opacity-60 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {status === 'submitting' ? 'Envoi…' : 'Envoyer le message'}
                    </span>
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
