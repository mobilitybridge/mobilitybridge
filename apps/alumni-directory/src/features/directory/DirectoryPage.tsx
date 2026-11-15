import { useTranslation } from 'react-i18next';

// Placeholder route. Owner and scope: see the "Who does what" table in the team plan.
export default function DirectoryPage() {
  const { t } = useTranslation();
  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold">{t('directory.title')}</h1>
      <p className="mt-2 text-gray-600">{t('common.comingSoon')}</p>
    </section>
  );
}
