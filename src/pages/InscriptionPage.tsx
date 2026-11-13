import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { fetchApiJson } from '../lib/api';
import { usePageSeo } from '../lib/format';
import type { RegistrationPayload } from '../types/competition';

const STEPS = [
  { num: 1, label: 'Informations personnelles' },
  { num: 2, label: 'Parcours académique' },
  { num: 3, label: 'Motivation' },
  { num: 4, label: 'Confirmation' },
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
    'Inscription',
    "Formulaire officiel d'inscription au concours UCAEP « Et si on lisait à haute voix ? » à l'ENSET de Lokossa.",
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
        return 'Veuillez indiquer votre nom et votre prénom.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return 'Veuillez saisir une adresse e-mail valide.';
      }
      if (form.phone.trim().length < 6) {
        return 'Veuillez saisir un numéro de téléphone valide.';
      }
      if (!form.birthDate) {
        return 'Veuillez indiquer votre date de naissance.';
      }
    }
    if (currentStep === 2) {
      if (!form.institution.trim() || !form.department.trim()) {
        return 'Veuillez préciser votre établissement et votre filière.';
      }
      if (!form.studyLevel.trim() || !form.studentId.trim()) {
        return "Veuillez indiquer votre niveau d'études et votre matricule étudiant.";
      }
    }
    if (currentStep === 3) {
      if (form.motivation.trim().length < 25) {
        return 'Présentez votre motivation en au moins 25 caractères.';
      }
      if (!form.acceptRules) {
        return 'Veuillez accepter le règlement officiel du concours pour continuer.';
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
          "L'enregistrement n'a pas pu être confirmé par le serveur. Veuillez réessayer.",
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
          : 'Une erreur technique est survenue. Votre inscription n’a pas été enregistrée.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#FBF9F5] min-h-[82vh]">
      <section className="py-12 lg:py-16 border-b border-[#4E2A1E]/12 paper-grain">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
            Candidature · Édition 2026
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E]">
            Inscription au concours
          </h1>
          <p className="text-sm sm:text-base text-[#1A1A1A]/75">
            Participation gratuite ouverte aux étudiants de l&apos;ENSET de Lokossa
            jusqu&apos;au vendredi 20 novembre 2026.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Step Progress */}
          <nav aria-label="Étapes du formulaire" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map((item) => {
              const isCurrent = step === item.num;
              const isDone = step > item.num;
              return (
                <div
                  key={item.num}
                  className={`pb-3 border-b-2 transition-colors ${
                    isCurrent
                      ? 'border-[#D19A3A] text-[#1A1A1A]'
                      : isDone
                        ? 'border-[#2E4D32] text-[#2E4D32]'
                        : 'border-[#4E2A1E]/15 text-[#1A1A1A]/45'
                  }`}
                >
                  <div className="text-xs font-medium tabular-nums flex items-center gap-1.5">
                    <span>0{item.num}</span>
                    {isDone && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-xs sm:text-sm font-medium mt-0.5 truncate">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>

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
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                  1. Informations personnelles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    label="Prénom"
                    id="firstName"
                    value={form.firstName}
                    onChange={(v) => updateField('firstName', v)}
                    placeholder="Ex. Adjovi"
                    required
                  />
                  <Field
                    label="Nom"
                    id="lastName"
                    value={form.lastName}
                    onChange={(v) => updateField('lastName', v)}
                    placeholder="Ex. Houngbédji"
                    required
                  />
                  <Field
                    label="Adresse e-mail"
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(v) => updateField('email', v)}
                    placeholder="etudiant@exemple.bj"
                    required
                  />
                  <Field
                    label="Téléphone (WhatsApp)"
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => updateField('phone', v)}
                    placeholder="Numéro joignable"
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
                      className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                    >
                      <option value="Féminin">Féminin</option>
                      <option value="Masculin">Masculin</option>
                      <option value="Préfère ne pas préciser">
                        Préfère ne pas préciser
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                  2. Parcours académique
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
                    label="Filière / Département"
                    id="department"
                    value={form.department}
                    onChange={(v) => updateField('department', v)}
                    placeholder="Ex. Génie Électrique, Informatique…"
                    required
                  />
                  <div className="space-y-1.5">
                    <label
                      htmlFor="studyLevel"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                    >
                      Niveau d&apos;études
                    </label>
                    <select
                      id="studyLevel"
                      value={form.studyLevel}
                      onChange={(e) => updateField('studyLevel', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                    >
                      <option value="Licence 1">Licence 1</option>
                      <option value="Licence 2">Licence 2</option>
                      <option value="Licence 3">Licence 3</option>
                      <option value="Master 1">Master 1</option>
                      <option value="Master 2">Master 2</option>
                    </select>
                  </div>
                  <Field
                    label="Numéro matricule étudiant"
                    id="studentId"
                    value={form.studentId}
                    onChange={(v) => updateField('studentId', v)}
                    placeholder="Votre matricule universitaire"
                    required
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                  3. Motivation
                </h2>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="motivation"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                    >
                      Pourquoi souhaitez-vous participer ?
                    </label>
                    <textarea
                      id="motivation"
                      rows={4}
                      value={form.motivation}
                      onChange={(e) => updateField('motivation', e.target.value)}
                      placeholder="Expliquez en quelques lignes votre intérêt pour l'écriture, la lecture ou l'éloquence."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="readingExperience"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
                    >
                      Un livre ou un texte qui vous a marqué (optionnel)
                    </label>
                    <input
                      id="readingExperience"
                      type="text"
                      value={form.readingExperience}
                      onChange={(e) => updateField('readingExperience', e.target.value)}
                      placeholder="Titre et auteur, si vous le souhaitez"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-sm border border-[#4E2A1E]/15 bg-[#F7E6C8]/25 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptRules}
                      onChange={(e) => updateField('acceptRules', e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#4E2A1E]"
                    />
                    <span className="text-sm text-[#1A1A1A]/85 leading-relaxed">
                      Je certifie être étudiant(e) inscrit(e) et j&apos;accepte le
                      traitement de mes données par l&apos;UCAEP pour l&apos;organisation
                      du concours.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-semibold text-[#4E2A1E]">
                  4. Vérification et confirmation
                </h2>
                <p className="text-sm text-[#1A1A1A]/75">
                  Vérifiez vos informations avant l&apos;enregistrement définitif de votre
                  candidature.
                </p>

                <dl className="divide-y divide-[#4E2A1E]/12 border border-[#4E2A1E]/15 rounded-sm bg-white">
                  <SummaryRow
                    label="Candidat"
                    value={`${form.firstName} ${form.lastName}`}
                  />
                  <SummaryRow label="Adresse e-mail" value={form.email} />
                  <SummaryRow label="Téléphone" value={form.phone} />
                  <SummaryRow
                    label="Parcours"
                    value={`${form.institution} · ${form.department} (${form.studyLevel})`}
                  />
                  <SummaryRow label="Matricule" value={form.studentId} />
                  <SummaryRow label="Motivation" value={form.motivation} />
                </dl>
              </div>
            )}

            <div className="pt-4 border-t border-[#4E2A1E]/12 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep((s) => s - 1);
                  }}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-sm border border-[#4E2A1E]/25 text-[#4E2A1E] hover:bg-[#4E2A1E]/5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>
              ) : (
                <span />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-[#4E2A1E] text-[#FBF9F5] hover:bg-[#3a1f16] transition-colors"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] disabled:opacity-60 transition-colors"
                >
                  <span>
                    {submitting ? 'Enregistrement en cours…' : "Valider mon inscription"}
                  </span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
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
        className="block text-xs font-semibold uppercase tracking-wider text-[#4E2A1E]"
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
        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#4E2A1E]/25 rounded-sm focus:border-[#D19A3A] focus:outline-none"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-sm">
      <dt className="font-medium text-[#4E2A1E]/75">{label}</dt>
      <dd className="sm:col-span-2 text-[#1A1A1A] break-words">{value}</dd>
    </div>
  );
}
