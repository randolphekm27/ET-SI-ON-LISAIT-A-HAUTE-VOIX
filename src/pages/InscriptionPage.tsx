import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Feather } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';
import type { RegistrationPayload } from '../types/competition';

const STEPS = [
  { num: 1, label: 'Faire connaissance' },
  { num: 2, label: 'Vos études' },
  { num: 3, label: 'Votre motivation' },
  { num: 4, label: 'Vérification' },
];

const INITIAL_DATA: RegistrationPayload = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: 'Féminin',
  institution: 'ENSET de Lokossa',
  department: '',
  studyLevel: 'Licence 1',
  studentId: '',
  motivation: '',
  readingExperience: '',
  acceptRules: false,
};

export function InscriptionPage() {
  usePageSeo(
    "S'inscrire",
    "Inscrivez-vous gratuitement au concours UCAEP « Et si on lisait à haute voix ? » à l'ENSET de Lokossa jusqu'au vendredi 20 novembre 2026.",
  );

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegistrationPayload>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof RegistrationPayload>(
    key: K,
    value: RegistrationPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        return 'Ce champ est nécessaire pour continuer : indiquez votre prénom et votre nom.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return 'Cette adresse e-mail ne semble pas correcte.';
      }
      if (form.phone.trim().length < 6) {
        return 'Indiquez un numéro de téléphone joignable.';
      }
      if (!form.birthDate) {
        return 'Indiquez votre date de naissance pour continuer.';
      }
    }
    if (currentStep === 2) {
      if (!form.institution.trim() || !form.department.trim()) {
        return 'Précisez votre établissement et votre filière pour continuer.';
      }
      if (!form.studyLevel.trim() || !form.studentId.trim()) {
        return "Indiquez votre niveau d'études et votre numéro matricule.";
      }
    }
    if (currentStep === 3) {
      if (form.motivation.trim().length < 25) {
        return 'Dites-nous en au moins 25 caractères ce qui vous donne envie de participer.';
      }
      if (!form.acceptRules) {
        return "Cochez la case d'accord ci-dessous pour valider votre inscription.";
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err1 = validateStep(1);
    const err2 = validateStep(2);
    const err3 = validateStep(3);
    if (err1 || err2 || err3) {
      setError(err1 || err2 || err3);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await fetchApiJson<{
        saved: boolean;
        referenceCode: string;
        candidateName: string;
        department: string;
        studyLevel: string;
        createdAt: string;
        syncedToGoogleSheets: boolean;
      }>('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!data.saved) {
        throw new Error(
          "L'enregistrement n'a pas pu être confirmé. Merci de réessayer dans un instant.",
        );
      }

      navigate('/confirmation-inscription', {
        state: {
          referenceCode: data.referenceCode,
          candidateName: data.candidateName,
          department: data.department,
          studyLevel: data.studyLevel,
          createdAt: data.createdAt,
          syncedToGoogleSheets: data.syncedToGoogleSheets,
        },
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Un souci technique a empêché l'envoi. Votre inscription n'a pas encore été enregistrée.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-ucaep-paper min-h-[82vh]">
      <PageFolioHeader
        folio="Inscription"
        section="Édition 2026 · ENSET de Lokossa"
        title="S'inscrire"
        italicWord="au concours"
        subtitle="C'est gratuit et ouvert à tous les étudiants jusqu'au vendredi 20 novembre 2026. Cela vous prendra deux minutes."
      />

      <section className="relative py-12 lg:py-20 bg-ucaep-paper paper-fiber overflow-hidden">
        <BrandPatternSurface
          variant="gold"
          tileWidth={220}
          opacityClass="opacity-[0.04]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="brown"
          tileWidth={135}
          blendMultiply
          doubleRing
          className="hidden lg:block -bottom-24 -left-16 w-64 h-64 opacity-[0.08]"
        />
        <BrandPatternWave
          variant="gold"
          tileWidth={170}
          opacity={0.08}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />
        <Feather
          aria-hidden="true"
          className="pointer-events-none select-none hidden md:block absolute top-10 right-8 w-44 h-44 text-ucaep-brown opacity-[0.04] -rotate-12"
          strokeWidth={1.1}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Focused Progression Rail */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            <EditorialMark folio={`Étape 0${step} / 04`} label="Progression" tone="brown" />

            <nav aria-label="Étapes de l'inscription" className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-0 lg:divide-y lg:divide-ucaep-brown/14 lg:border-t lg:border-b lg:border-ucaep-brown/14">
              {STEPS.map((item) => {
                const isCurrent = step === item.num;
                const isDone = step > item.num;
                return (
                  <div
                    key={item.num}
                    className={`py-3 lg:py-4 flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'text-ucaep-ink font-semibold'
                        : isDone
                          ? 'text-ucaep-green'
                          : 'text-ucaep-ink/42'
                    }`}
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span
                        className={`font-serif text-2xl tabular-nums ${
                          isCurrent
                            ? 'text-ucaep-gold'
                            : isDone
                              ? 'text-ucaep-green'
                              : 'text-ucaep-brown/35'
                        }`}
                      >
                        0{item.num}
                      </span>
                      <span className="text-sm truncate">{item.label}</span>
                    </div>
                    {isDone && <Check className="w-4 h-4 text-ucaep-green shrink-0" />}
                  </div>
                );
              })}
            </nav>

            <div className="hidden lg:block text-xs text-ucaep-brown/75 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-ucaep-brown">Participation gratuite</p>
              <p>Ouvert à tous les étudiants, quelle que soit votre filière.</p>
            </div>
          </aside>

          {/* Right Form Desk */}
          <div className="lg:col-span-8">
            <div className="p-6 sm:p-10 bg-white border border-ucaep-brown/15 rounded-sm space-y-8">
              {error && (
                <div
                  role="alert"
                  className="p-4 rounded-sm border border-red-800/30 bg-red-50 text-red-900 text-sm flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-6"
                    >
                      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                        Commençons par faire connaissance.
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                          label="Prénom"
                          id="firstName"
                          value={form.firstName}
                          onChange={(v) => updateField('firstName', v)}
                          placeholder="Votre prénom"
                          required
                        />
                        <Field
                          label="Nom"
                          id="lastName"
                          value={form.lastName}
                          onChange={(v) => updateField('lastName', v)}
                          placeholder="Votre nom de famille"
                          required
                        />
                        <Field
                          label="Adresse e-mail"
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(v) => updateField('email', v)}
                          placeholder="exemple@email.com"
                          required
                        />
                        <Field
                          label="Téléphone (WhatsApp)"
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(v) => updateField('phone', v)}
                          placeholder="Ex. +229 01 …"
                          required
                        />
                        <Field
                          label="Date de naissance"
                          id="birthDate"
                          type="date"
                          value={form.birthDate}
                          onChange={(v) => updateField('birthDate', v)}
                          required
                        />
                        <div className="space-y-1.5">
                          <label
                            htmlFor="gender"
                            className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                          >
                            Genre
                          </label>
                          <select
                            id="gender"
                            value={form.gender}
                            onChange={(e) =>
                              updateField(
                                'gender',
                                e.target.value as RegistrationPayload['gender'],
                              )
                            }
                            className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                          >
                            <option value="Féminin">Féminin</option>
                            <option value="Masculin">Masculin</option>
                            <option value="Préfère ne pas préciser">
                              Préfère ne pas préciser
                            </option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-6"
                    >
                      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                        Parlons un peu de vos études.
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                          label="Établissement"
                          id="institution"
                          value={form.institution}
                          onChange={(v) => updateField('institution', v)}
                          required
                        />
                        <Field
                          label="Filière ou département"
                          id="department"
                          value={form.department}
                          onChange={(v) => updateField('department', v)}
                          placeholder="Ex. Génie Électrique, Informatique…"
                          required
                        />
                        <div className="space-y-1.5">
                          <label
                            htmlFor="studyLevel"
                            className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                          >
                            Niveau d&apos;études
                          </label>
                          <select
                            id="studyLevel"
                            value={form.studyLevel}
                            onChange={(e) => updateField('studyLevel', e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                          >
                            <option value="Licence 1">Licence 1</option>
                            <option value="Licence 2">Licence 2</option>
                            <option value="Licence 3">Licence 3</option>
                            <option value="Master 1">Master 1</option>
                            <option value="Master 2">Master 2</option>
                          </select>
                        </div>
                        <Field
                          label="Numéro matricule"
                          id="studentId"
                          value={form.studentId}
                          onChange={(v) => updateField('studentId', v)}
                          placeholder="Votre matricule étudiant"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-6"
                    >
                      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                        Qu&apos;est-ce qui vous donne envie de participer ?
                      </h2>
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="motivation"
                            className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                          >
                            Quelques mots sur votre motivation
                          </label>
                          <textarea
                            id="motivation"
                            rows={4}
                            value={form.motivation}
                            onChange={(e) => updateField('motivation', e.target.value)}
                            placeholder="Racontez-nous simplement ce qui vous attire dans l'écriture, la lecture ou la prise de parole."
                            className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="readingExperience"
                            className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                          >
                            Un livre ou un texte que vous aimez (facultatif)
                          </label>
                          <input
                            id="readingExperience"
                            type="text"
                            value={form.readingExperience}
                            onChange={(e) =>
                              updateField('readingExperience', e.target.value)
                            }
                            placeholder="Si un titre vous vient à l'esprit"
                            className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                          />
                        </div>

                        <label className="flex items-start gap-3 p-4 rounded-sm border border-ucaep-brown/15 bg-ucaep-linen/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.acceptRules}
                            onChange={(e) =>
                              updateField('acceptRules', e.target.checked)
                            }
                            className="mt-1 h-4 w-4 accent-ucaep-brown"
                          />
                          <span className="text-sm text-ucaep-ink/85 leading-relaxed">
                            Je confirme être inscrit(e) comme étudiant(e) et j&apos;accepte
                            que l&apos;équipe de l&apos;UCAEP utilise ces informations
                            pour organiser le concours.
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-6"
                    >
                      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                        On vérifie une dernière fois avant d&apos;envoyer.
                      </h2>
                      <p className="text-sm text-ucaep-ink/75">
                        Relisez rapidement vos informations. Si tout est bon, vous pouvez
                        envoyer votre inscription.
                      </p>

                      <dl className="divide-y divide-ucaep-brown/12 border-t border-b border-ucaep-brown/15">
                        <SummaryRow
                          label="Nom et prénom"
                          value={`${form.firstName} ${form.lastName}`}
                        />
                        <SummaryRow label="Adresse e-mail" value={form.email} />
                        <SummaryRow label="Téléphone" value={form.phone} />
                        <SummaryRow
                          label="Études"
                          value={`${form.institution} · ${form.department} (${form.studyLevel})`}
                        />
                        <SummaryRow label="Matricule" value={form.studentId} />
                        <SummaryRow label="Motivation" value={form.motivation} />
                      </dl>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-5 border-t border-ucaep-brown/12 flex items-center justify-between gap-4">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep((s) => s - 1);
                      }}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-sm border border-ucaep-brown/25 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Retour</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors"
                    >
                      <span>Continuer</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] disabled:opacity-60 transition-colors"
                    >
                      <span>
                        {submitting ? 'Envoi en cours…' : 'Envoyer mon inscription'}
                      </span>
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm">
      <dt className="font-medium text-ucaep-brown/75">{label}</dt>
      <dd className="sm:col-span-2 text-ucaep-ink wrap-break-word">{value}</dd>
    </div>
  );
}
