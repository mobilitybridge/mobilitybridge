import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchExistingAlumni, fetchUniversities, runImport, type ImportResult } from './api';
import { buildRecords } from './buildRecords';
import { guessMapping, missingRequired, REQUIRED_FIELDS, TARGET_FIELDS, type ColumnMapping } from './columns';
import { countryName } from './countries';
import { findMatches, summarize, type Action, type Decision, type ExistingAlumnus } from './dedupe';
import type { UniversityRef } from './normalize';
import { readSheet, type Sheet } from './readSheet';

type Step = 'pick' | 'map' | 'review' | 'done';

export default function ImportPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('pick');
  const [fileName, setFileName] = useState('');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [universities, setUniversities] = useState<UniversityRef[]>([]);
  const [existing, setExisting] = useState<ExistingAlumnus[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchUniversities().then(setUniversities, () => setError(t('import.errors.loadFailed')));
  }, [t]);

  async function openFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const read = await readSheet(file);
      if (read.rows.length === 0) throw new Error('empty');
      setFileName(file.name);
      setSheet(read);
      setMapping(guessMapping(read.headers));
      setStep('map');
    } catch {
      setError(t('import.errors.unreadable'));
    } finally {
      setBusy(false);
    }
  }

  const built = useMemo(
    () => (sheet && mapping ? buildRecords(sheet, mapping, universities) : null),
    [sheet, mapping, universities],
  );

  async function review() {
    if (!built) return;
    setBusy(true);
    setError(null);
    try {
      const people = await fetchExistingAlumni();
      setExisting(people);
      setDecisions(findMatches(built.people, people));
      setStep('review');
    } catch {
      setError(t('import.errors.loadFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      setResult(await runImport(fileName, decisions));
      setStep('done');
    } catch {
      setError(t('import.errors.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep('pick');
    setSheet(null);
    setMapping(null);
    setDecisions([]);
    setResult(null);
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">{t('import.title')}</h1>
        <p className="text-gray-600">{t('import.intro')}</p>
      </header>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{error}</p>}

      {step === 'pick' && (
        <label className="block rounded-lg border-2 border-dashed bg-white p-10 text-center">
          <span className="font-medium">{t('import.pick.label')}</span>
          <span className="mt-1 block text-sm text-gray-500">{t('import.pick.hint')}</span>
          <input
            type="file"
            accept=".xlsx,.csv"
            disabled={busy}
            className="mx-auto mt-4 block"
            onChange={(e) => e.target.files?.[0] && void openFile(e.target.files[0])}
          />
        </label>
      )}

      {step === 'map' && sheet && mapping && built && (
        <MappingStep
          sheet={sheet}
          mapping={mapping}
          onChange={setMapping}
          onBack={reset}
          onNext={() => void review()}
          busy={busy}
        />
      )}

      {step === 'review' && built && (
        <ReviewStep
          decisions={decisions}
          errors={built.errors}
          warningCount={built.warnings.length}
          universities={universities}
          existingCount={existing.length}
          onChange={setDecisions}
          onBack={() => setStep('map')}
          onSave={() => void save()}
          busy={busy}
        />
      )}

      {step === 'done' && result && (
        <div className="space-y-3 rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">{t('import.done.title')}</h2>
          <ul className="list-disc ps-6">
            <li>{t('import.done.inserted', { count: result.inserted })}</li>
            <li>{t('import.done.merged', { count: result.merged })}</li>
            <li>{t('import.done.skipped', { count: result.skipped })}</li>
            <li>{t('import.done.mobilities', { count: result.mobilities_added })}</li>
          </ul>
          <button className="rounded border px-4 py-2" onClick={reset}>{t('import.done.again')}</button>
        </div>
      )}
    </section>
  );
}

function MappingStep(props: {
  sheet: Sheet;
  mapping: ColumnMapping;
  onChange: (m: ColumnMapping) => void;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const missing = missingRequired(props.mapping);
  const sample = (index: number | null) =>
    index === null ? '' : props.sheet.rows.map((r) => r[index]).find((v) => v) ?? '';

  return (
    <div className="space-y-4">
      <p>{t('import.map.intro', { rows: props.sheet.rows.length })}</p>
      <table className="w-full border-collapse overflow-hidden rounded-lg bg-white text-sm">
        <thead>
          <tr className="border-b text-start text-gray-600">
            <th className="p-2 text-start">{t('import.map.ourField')}</th>
            <th className="p-2 text-start">{t('import.map.theirColumn')}</th>
            <th className="p-2 text-start">{t('import.map.example')}</th>
          </tr>
        </thead>
        <tbody>
          {TARGET_FIELDS.map((field) => (
            <tr key={field} className="border-b last:border-0">
              <td className="p-2">
                {t(`fields.${field}`)}
                {REQUIRED_FIELDS.includes(field) && <span className="text-red-700"> *</span>}
              </td>
              <td className="p-2">
                <select
                  className="w-full rounded border px-2 py-1"
                  value={props.mapping[field] ?? ''}
                  onChange={(e) =>
                    props.onChange({ ...props.mapping, [field]: e.target.value === '' ? null : Number(e.target.value) })
                  }
                >
                  <option value="">{t('import.map.notInSheet')}</option>
                  {props.sheet.headers.map((h, i) => (
                    <option key={i} value={i}>{h || t('import.map.column', { n: i + 1 })}</option>
                  ))}
                </select>
              </td>
              <td className="p-2 text-gray-500">{sample(props.mapping[field])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {missing.length > 0 && (
        <p className="text-red-700">
          {t('import.map.missing', { fields: missing.map((f) => t(`fields.${f}`)).join(t('common.listSeparator')) })}
        </p>
      )}
      <div className="flex gap-2">
        <button className="rounded border px-4 py-2" onClick={props.onBack}>{t('common.back')}</button>
        <button
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
          disabled={missing.length > 0 || props.busy}
          onClick={props.onNext}
        >
          {t('import.map.next')}
        </button>
      </div>
    </div>
  );
}

function ReviewStep(props: {
  decisions: Decision[];
  errors: { row: number; code: string; value?: string }[];
  warningCount: number;
  universities: UniversityRef[];
  existingCount: number;
  onChange: (d: Decision[]) => void;
  onBack: () => void;
  onSave: () => void;
  busy: boolean;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.language === 'ar' ? 'ar' : 'en';
  const summary = summarize(props.decisions);
  const universityName = (id: number | null) => {
    const u = props.universities.find((x) => x.id === id);
    return u ? (language === 'ar' && u.name_ar ? u.name_ar : u.name_en) : '—';
  };
  const setAction = (index: number, action: Action) =>
    props.onChange(props.decisions.map((d, i) => (i === index ? { ...d, action } : d)));
  const toSave = props.decisions.filter((d) => d.action !== 'skip').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('import.review.new')} value={summary.newPeople} />
        <Stat label={t('import.review.sameEmail')} value={summary.sameEmail} tone="blue" />
        <Stat label={t('import.review.possible')} value={summary.possibleDuplicates} tone="amber" />
        <Stat label={t('import.review.errors')} value={props.errors.length} tone="red" />
      </div>
      <p className="text-sm text-gray-600">
        {t('import.review.comparedWith', { count: props.existingCount })}{' '}
        {props.warningCount > 0 && t('import.review.warnings', { count: props.warningCount })}
      </p>

      {props.errors.length > 0 && (
        <details className="rounded border border-red-200 bg-red-50 p-3" open>
          <summary className="cursor-pointer font-medium text-red-800">{t('import.review.errorsTitle')}</summary>
          <ul className="mt-2 list-disc ps-6 text-sm">
            {props.errors.map((e, i) => (
              <li key={i}>
                {t('import.review.row', { row: e.row })}: {t(`issues.${e.code}`)} {e.value ? `(${e.value})` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="p-2 text-start">{t('import.review.person')}</th>
              <th className="p-2 text-start">{t('fields.home_university')}</th>
              <th className="p-2 text-start">{t('import.review.trips')}</th>
              <th className="p-2 text-start">{t('import.review.match')}</th>
              <th className="p-2 text-start">{t('import.review.action')}</th>
            </tr>
          </thead>
          <tbody>
            {props.decisions.map((d, i) => {
              const a = d.person.alumni;
              return (
                <tr key={i} className={`border-b last:border-0 ${d.match?.kind === 'name' ? 'bg-amber-50' : ''}`}>
                  <td className="p-2">
                    <div className="font-medium">{(language === 'ar' ? a.full_name_ar ?? a.full_name_en : a.full_name_en ?? a.full_name_ar) ?? ''}</div>
                    <div className="text-gray-500" dir="ltr">{a.email ?? ''}</div>
                  </td>
                  <td className="p-2">{universityName(a.home_university_id)}</td>
                  <td className="p-2">
                    {d.person.mobilities.map((m) => `${countryName(m.host_country, language)} ${m.academic_year ?? ''}`).join(' · ')}
                  </td>
                  <td className="p-2">
                    {d.match ? (
                      <span className={d.match.kind === 'email' ? 'text-blue-800' : 'text-amber-800'}>
                        {t(`import.review.matchKind.${d.match.kind}`)}:{' '}
                        {(language === 'ar' ? d.match.existing.full_name_ar : d.match.existing.full_name_en) ??
                          d.match.existing.full_name_en ?? d.match.existing.full_name_ar}
                      </span>
                    ) : (
                      <span className="text-gray-500">{t('import.review.matchKind.none')}</span>
                    )}
                  </td>
                  <td className="p-2">
                    <select
                      className="rounded border px-2 py-1"
                      value={d.action}
                      onChange={(e) => setAction(i, e.target.value as Action)}
                    >
                      <option value="insert">{t(d.match ? 'import.review.actions.insertFlagged' : 'import.review.actions.insert')}</option>
                      {d.match && <option value="merge">{t('import.review.actions.merge')}</option>}
                      <option value="skip">{t('import.review.actions.skip')}</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button className="rounded border px-4 py-2" onClick={props.onBack}>{t('common.back')}</button>
        <button
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
          disabled={props.busy || toSave === 0}
          onClick={props.onSave}
        >
          {t('import.review.save', { count: toSave })}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'gray' }: { label: string; value: number; tone?: 'gray' | 'blue' | 'amber' | 'red' }) {
  const colors = {
    gray: 'border-gray-200',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
  };
  return (
    <div className={`rounded-lg border bg-white p-3 ${colors[tone]}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
