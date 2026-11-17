import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { EDITORIAL_EASE } from '../lib/motion';
import type { SubmissionStatus } from '../types/competition';

interface CountdownParts {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeCountdown(isoDeadline: string): CountdownParts | null {
  const targetMs = Date.parse(isoDeadline);
  if (Number.isNaN(targetMs)) return null;
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { expired: false, days, hours, minutes, seconds };
}

interface CandidateProgressCardProps {
  referenceCode: string;
  phaseNumber: string;
  phaseTitle: string;
  isPresentiel: boolean;
  acceptingNow: boolean;
  submissionDeadline?: string | null;
  hasGoogleForm: boolean;
  text1Submitted: boolean;
  text1Status: SubmissionStatus | null;
  text2Submitted: boolean;
  text2Status: SubmissionStatus | null;
  fileSubmitted: boolean;
  fileStatus: SubmissionStatus | null;
  onCopyReference?: () => void;
  copiedRef?: boolean;
}

export function CandidateProgressCard({
  referenceCode,
  phaseNumber,
  phaseTitle,
  isPresentiel,
  acceptingNow,
  submissionDeadline,
  hasGoogleForm,
  text1Submitted,
  text1Status,
  text2Submitted,
  text2Status,
  fileSubmitted,
  fileStatus,
  onCopyReference,
  copiedRef = false,
}: CandidateProgressCardProps) {
  const [countdown, setCountdown] = useState<CountdownParts | null>(() =>
    submissionDeadline ? computeCountdown(submissionDeadline) : null,
  );

  useEffect(() => {
    if (!submissionDeadline) {
      setCountdown(null);
      return;
    }
    setCountdown(computeCountdown(submissionDeadline));
    const timer = window.setInterval(() => {
      setCountdown(computeCountdown(submissionDeadline));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submissionDeadline]);

  const step1Done = true; // Candidat identifié / inscrit
  const step2Done = isPresentiel
    ? true
    : hasGoogleForm
      ? text1Submitted
      : text1Submitted || fileSubmitted;
  const step2Validated = isPresentiel
    ? false
    : hasGoogleForm
      ? text1Status === 'validated'
      : text1Status === 'validated' || fileStatus === 'validated';
  const step3Done = isPresentiel
    ? false
    : hasGoogleForm
      ? text2Submitted
      : text2Submitted || fileSubmitted;
  const step3Validated = isPresentiel
    ? false
    : hasGoogleForm
      ? text2Status === 'validated'
      : text2Status === 'validated' || fileStatus === 'validated';
  const step4Done = isPresentiel
    ? false
    : hasGoogleForm
      ? text1Status === 'validated' && text2Status === 'validated'
      : (text1Status === 'validated' && text2Status === 'validated') ||
        fileStatus === 'validated';

  const milestones = isPresentiel
    ? [
        {
          num: '01',
          title: 'Inscription UCAEP',
          state: 'done' as const,
          detail: 'Dossier vérifié',
        },
        {
          num: '02',
          title: 'Ateliers Jours 12–13',
          state: 'pending' as const,
          detail: 'Présence campus',
        },
        {
          num: '03',
          title: 'Passage en présentiel',
          state: 'pending' as const,
          detail: 'Jour 14 devant jury',
        },
        {
          num: '04',
          title: 'Attestation officielle',
          state: 'pending' as const,
          detail: 'Remise en clôture',
        },
      ]
    : [
        {
          num: '01',
          title: 'Inscription validée',
          state: step1Done ? ('validated' as const) : ('pending' as const),
          detail: 'Code anonyme actif',
        },
        {
          num: '02',
          title: 'Texte 1 (Épreuve 1)',
          state: step2Validated
            ? ('validated' as const)
            : step2Done
              ? ('done' as const)
              : ('pending' as const),
          detail: step2Validated
            ? 'Validé · Verrouillé'
            : text1Status === 'rejected'
              ? 'À modifier et renvoyer'
              : step2Done
                ? 'Reçu · En attente de validation'
                : 'À déposer',
        },
        {
          num: '03',
          title: 'Texte 2 (Épreuve 2)',
          state: step3Validated
            ? ('validated' as const)
            : step3Done
              ? ('done' as const)
              : ('pending' as const),
          detail: step3Validated
            ? 'Validé · Verrouillé'
            : text2Status === 'rejected'
              ? 'À modifier et renvoyer'
              : step3Done
                ? 'Reçu · En attente de validation'
                : 'À déposer',
        },
        {
          num: '04',
          title: 'Dossier complet',
          state: step4Done ? ('validated' as const) : ('pending' as const),
          detail: step4Done
            ? 'Tout est validé'
            : hasGoogleForm
              ? 'Textes + formulaire vidéo'
              : 'En attente de validation',
        },
      ];

  return (
    <div className="bg-white border border-ucaep-brown/16 rounded-[2px] p-5 sm:p-6 space-y-5">
      {/* Ligne supérieure : Badge anonyme + Compte à rebours */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ucaep-brown/12 pb-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucaep-green">
            Suivi en direct · Phase {phaseNumber} ({phaseTitle})
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-base sm:text-lg font-bold text-ucaep-brown tabular-nums">
              {referenceCode}
            </span>
            {onCopyReference && (
              <button
                type="button"
                onClick={onCopyReference}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[2px] border border-ucaep-brown/20 bg-ucaep-paper text-ucaep-brown hover:border-ucaep-gold transition-colors"
              >
                {copiedRef ? (
                  <>
                    <Check className="w-3 h-3 text-ucaep-green" aria-hidden="true" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copier le code</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Compte à rebours dynamique */}
        {countdown && !isPresentiel ? (
          <div className="p-3 bg-ucaep-paper border border-ucaep-brown/15 rounded-[2px] flex items-center gap-3 self-start md:self-center">
            <Clock
              className={`w-4 h-4 shrink-0 ${
                countdown.expired ? 'text-red-700' : 'text-ucaep-gold'
              }`}
              aria-hidden="true"
            />
            {countdown.expired ? (
              <span className="text-xs font-semibold text-red-800">
                Date limite dépassée
              </span>
            ) : (
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ucaep-brown/70">
                  Temps restant avant clôture
                </p>
                <p className="font-mono text-sm font-bold text-ucaep-brown tabular-nums">
                  {countdown.days}j {String(countdown.hours).padStart(2, '0')}h{' '}
                  {String(countdown.minutes).padStart(2, '0')}m{' '}
                  {String(countdown.seconds).padStart(2, '0')}s
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs font-medium text-ucaep-brown/75 inline-flex items-center gap-1.5">
            {acceptingNow ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-ucaep-gold" aria-hidden="true" />
                <span>Dépôts ouverts</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-ucaep-brown/60" aria-hidden="true" />
                <span>
                  {isPresentiel ? 'Format présentiel' : 'Hors fenêtre de dépôt'}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Jauge globale de complétion du dossier */}
      {(() => {
        const completedCount = milestones.filter(
          (m) => m.state === 'validated' || m.state === 'done',
        ).length;
        const ratio = milestones.length > 0 ? completedCount / milestones.length : 0;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-ucaep-brown/75 tabular-nums">
              <span>Avancement du dossier</span>
              <span>
                {completedCount} / {milestones.length} étapes
              </span>
            </div>
            <div className="h-1.5 w-full bg-ucaep-brown/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: ratio }}
                transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
                className="h-full w-full origin-left bg-ucaep-green"
              />
            </div>
          </div>
        );
      })()}

      {/* Frise des 4 jalons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {milestones.map((m, idx) => {
          const isValidated = m.state === 'validated';
          const isDone = m.state === 'done';
          return (
            <motion.div
              key={m.num}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: idx * 0.05, ease: EDITORIAL_EASE }}
              className={`p-3.5 rounded-[2px] border space-y-1 transition-colors ${
                isValidated
                  ? 'bg-emerald-50/65 border-ucaep-green/35'
                  : isDone
                    ? 'bg-amber-50/60 border-ucaep-gold/45'
                    : 'bg-ucaep-paper/60 border-ucaep-brown/12'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold text-ucaep-gold tabular-nums">
                  {m.num}
                </span>
                {isValidated ? (
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-ucaep-green shrink-0"
                    aria-hidden="true"
                  />
                ) : isDone ? (
                  <FileCheck2
                    className="w-3.5 h-3.5 text-ucaep-gold shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock
                    className="w-3.5 h-3.5 text-ucaep-brown/40 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="text-xs font-semibold text-ucaep-brown leading-snug">
                {m.title}
              </p>
              <p
                className={`text-[11px] font-medium ${
                  isValidated
                    ? 'text-ucaep-green'
                    : isDone
                      ? 'text-amber-800'
                      : 'text-ucaep-ink/65'
                }`}
              >
                {m.detail}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
