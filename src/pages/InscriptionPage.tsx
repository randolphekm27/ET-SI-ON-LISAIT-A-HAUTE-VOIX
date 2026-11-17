import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Feather,
  UserPlus,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { EditorialMark, PageFolioHeader } from '../components/EditorialMark';
import { EditorialReveal } from '../components/MotionPrimitives';
import { fetchApiJson } from '../lib/api';
import {
  clearCandidateSession,
  saveCandidateSession,
  useCandidateSession,
} from '../lib/candidate-session';
import { usePageSeo } from '../lib/format';
import { EDITORIAL_EASE, EDITORIAL_SPRING, TACTILE_SPRING } from '../lib/motion';
import type { RegistrationPayload } from '../types/competition';

const STEPS = [
  { num: 1, label: 'Identité et contact' },
  { num: 2, label: 'Parcours académique' },
  { num: 3, label: 'Démarche et accord' },
  { num: 4, label: 'Validation' },
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
    "Inscription gratuite au concours « Et si on lisait à haute voix ? », ouvert exclusivement aux étudiants de l'ENSET de Lokossa jusqu'au vendredi 20 novembre 2026.",
  );

  const navigate = useNavigate();
  const existingSession = useCandidateSession();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegistrationPayload>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const stepRailId = useId();

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
        return 'Précisez votre démarche en au moins 25 caractères pour valider cette étape.';
      }
      if (!form.acceptRules) {
        return "Confirmez votre statut d'étudiant(e) à l'ENSET de Lokossa et l'acceptation du règlement.";
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

      const receiptState = {
        referenceCode: data.referenceCode,
        candidateName: data.candidateName,
        email: form.email.trim(),
        department: data.department,
        studyLevel: data.studyLevel,
        createdAt: data.createdAt,
        syncedToGoogleSheets: data.syncedToGoogleSheets,
      };
      saveCandidateSession(receiptState);

      navigate('/confirmation-inscription', {
        state: receiptState,
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

  if (existingSession) {
    return (
      <div className="bg-ucaep-paper min-h-[82vh]">
        <PageFolioHeader
          folio="Inscription"
          section="Édition 2026 · ENSET de Lokossa"
          title="Dossier déjà"
          italicWord="enregistré"
          subtitle="Votre participation est déjà enregistrée sur cet appareil."
        />

        <section className="relative py-14 lg:py-20 bg-ucaep-paper paper-fiber overflow-hidden">
          <BrandPatternSurface
            variant="gold"
            tileWidth={220}
            opacityClass="opacity-[0.04]"
            blendMultiply
          />
          <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
            <EditorialReveal>
              <div className="art-card p-8 sm:p-10 bg-white border border-ucaep-green/25 rounded-[2px] space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <EditorialMark folio="Confirmé" label="Déjà inscrit(e)" tone="green" />
                  <CheckCircle2 className="w-6 h-6 text-ucaep-green shrink-0" />
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown leading-tight">
                  Votre candidature est enregistrée
                  {existingSession.candidateName ? `, ${existingSession.candidateName}` : ''}.
                </h2>

                <p className="text-sm sm:text-base text-ucaep-ink/80 leading-relaxed">
                  Votre code d&apos;anonymat{' '}
                  <span className="font-mono font-semibold text-ucaep-brown">
                    {existingSession.referenceCode}
                  </span>{' '}
                  est actif. Vous pouvez accéder directement à votre espace de dépôt pour
                  consulter les consignes des phases et transmettre vos productions.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    to="/depot"
                    className="btn-tactile group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-[2px] bg-ucaep-gold text-ucaep-ink hover:bg-[#dfb05c]"
                  >
                    <span>Accéder à mon espace candidat</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/confirmation-inscription"
                    className="editorial-underline text-sm font-medium text-ucaep-brown"
                  >
                    Revoir mon reçu d&apos;inscription
                  </Link>
                </div>

                <div className="pt-4 border-t border-ucaep-brown/12">
                  <button
                    type="button"
                    onClick={() => clearCandidateSession()}
                    className="inline-flex items-center gap-2 text-xs text-ucaep-ink/65 hover:text-ucaep-brown underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Inscrire une autre personne sur cet appareil</span>
                  </button>
                </div>
              </div>
            </EditorialReveal>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-ucaep-paper min-h-[82vh]">
      <PageFolioHeader
        folio="Inscription"
        section="Édition 2026 · ENSET de Lokossa"
        title="Commencer"
        italicWord="mon inscription"
        subtitle="L'inscription est gratuite et réservée aux étudiants de l'ENSET de Lokossa jusqu'au vendredi 20 novembre 2026. Dès que vous validez la dernière étape, votre code d'anonymat personnel (UCAEP-2026-XXXX) est créé et affiché à l'écran."
        quickFacts={[
          { label: 'Durée estimée', value: 'Environ 2 minutes' },
          { label: 'Coût', value: 'Entièrement gratuit' },
          { label: 'Code anonyme', value: 'Généré à la validation' },
          { label: 'Clôture', value: '20 novembre 2026' },
        ]}
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
          orbit
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
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <EditorialMark folio={`Étape 0${step} / 04`} label="Progression" tone="brown" />

            <div className="space-y-1.5">
              <div className="h-[3px] w-full bg-ucaep-brown/12 overflow-hidden rounded-full">
                <motion.div
                  aria-hidden="true"
                  initial={false}
                  animate={{ scaleX: step / 4 }}
                  transition={{ duration: 0.35, ease: EDITORIAL_EASE }}
                  className="h-full w-full bg-ucaep-gold origin-left"
                />
              </div>
            </div>

            <nav aria-label="Étapes de l'inscription" className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-0 lg:divide-y lg:divide-ucaep-brown/14 lg:border-t lg:border-b lg:border-ucaep-brown/14">
              {STEPS.map((item) => {
                const isCurrent = step === item.num;
                const isDone = step > item.num;
                return (
                  <div
                    key={item.num}
                    className={`relative py-3 lg:py-4 pl-3 pr-2 flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'text-ucaep-ink font-semibold'
                        : isDone
                          ? 'text-ucaep-green'
                          : 'text-ucaep-ink/42'
                    }`}
                  >
                    {isCurrent && (
                      <motion.span
                        layoutId={`inscription-step-${stepRailId}`}
                        aria-hidden="true"
                        transition={EDITORIAL_SPRING}
                        className="hidden lg:block absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-ucaep-gold"
                      />
                    )}
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

            <div className="hidden lg:block space-y-4 text-xs text-ucaep-brown/80 leading-relaxed border-t border-ucaep-brown/14 pt-5">
              <div className="space-y-1">
                <p className="font-semibold text-ucaep-brown">À quoi sert votre code UCAEP ?</p>
                <p>
                  À la fin du formulaire, vous recevez un code du type{' '}
                  <span className="font-mono font-semibold">UCAEP-2026-XXXX</span>. Ce code remplace votre nom devant le jury lorsque vous déposez vos textes et vos vidéos.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-ucaep-brown">Gratuit et sans prérequis</p>
                <p>
                  Aucune expérience préalable en théâtre n&apos;est demandée : le concours est ouvert gratuitement à toutes les filières de l&apos;ENSET de Lokossa.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Form Desk */}
          <div className="lg:col-span-8">
            <div className="p-6 sm:p-10 bg-white border border-ucaep-brown/15 rounded-sm space-y-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key={error}
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
                    className="p-4 rounded-sm border border-red-800/30 bg-red-50 text-red-900 text-sm flex items-start gap-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                          Identité et coordonnées de contact.
                        </h2>
                        <p className="text-sm text-ucaep-ink/75 leading-relaxed">
                          Votre adresse e-mail sert ensuite à vous connecter à votre espace de dépôt. Votre numéro WhatsApp permet à l&apos;équipe de vous avertir lors de l&apos;ouverture des phases.
                        </p>
                      </div>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                          Filière et niveau à l&apos;ENSET de Lokossa.
                        </h2>
                        <p className="text-sm text-ucaep-ink/75 leading-relaxed">
                          Votre numéro matricule confirme votre statut d&apos;étudiant(e) à l&apos;ENSET de Lokossa. Ni votre filière ni votre niveau ne sont montrés aux correcteurs.
                        </p>
                      </div>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                          Votre démarche et votre accord.
                        </h2>
                        <p className="text-sm text-ucaep-ink/75 leading-relaxed">
                          Dites-nous simplement en deux ou trois phrases ce qui vous donne envie de participer. Ce champ n&apos;est pas noté : il aide l&apos;équipe UCAEP à mieux connaître les participants.
                        </p>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="motivation"
                            className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                          >
                            Pourquoi souhaitez-vous participer ? (25 caractères min.)
                          </label>
                          <textarea
                            id="motivation"
                            rows={4}
                            value={form.motivation}
                            onChange={(e) => updateField('motivation', e.target.value)}
                            placeholder="Par exemple : envie d'améliorer votre prise de parole, goût pour l'écriture, curiosité pour les ateliers de diction..."
                            className="w-full px-3.5 py-2.5 text-sm bg-ucaep-paper/50 border border-ucaep-brown/25 rounded-sm focus:border-ucaep-gold focus:bg-white focus:outline-none transition-colors"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="readingExperience"
                            className="block text-xs font-semibold uppercase tracking-wider text-ucaep-brown"
                          >
                            Référence de lecture ou d&apos;ouvrage (facultatif)
                          </label>
                          <input
                            id="readingExperience"
                            type="text"
                            value={form.readingExperience}
                            onChange={(e) =>
                              updateField('readingExperience', e.target.value)
                            }
                            placeholder="Un livre, essai ou texte qui a marqué votre parcours"
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
                            Je confirme être étudiant(e) régulièrement inscrit(e) à l&apos;ENSET de
                            Lokossa et j&apos;accepte le traitement de ces informations par l&apos;UCAEP
                            pour l&apos;organisation anonyme du concours.
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                      className="space-y-6"
                    >
                      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ucaep-brown">
                        Vérification de votre dossier avant enregistrement.
                      </h2>
                      <p className="text-sm text-ucaep-ink/75">
                        Relisez attentivement vos coordonnées et votre matricule. La validation
                        génère immédiatement votre code d&apos;anonymat UCAEP.
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
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      transition={TACTILE_SPRING}
                      onClick={() => {
                        setError(null);
                        setStep((s) => s - 1);
                      }}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-sm border border-ucaep-brown/25 text-ucaep-brown hover:bg-ucaep-brown/5 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Retour</span>
                    </motion.button>
                  ) : (
                    <span />
                  )}

                  {step < 4 ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      transition={TACTILE_SPRING}
                      onClick={handleNext}
                      className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16] transition-colors"
                    >
                      <span>Continuer</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      transition={TACTILE_SPRING}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] disabled:opacity-60 transition-colors"
                    >
                      <span>
                        {submitting ? 'Enregistrement en cours…' : 'Valider et générer mon code UCAEP'}
                      </span>
                      <Check className="w-4 h-4" />
                    </motion.button>
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
