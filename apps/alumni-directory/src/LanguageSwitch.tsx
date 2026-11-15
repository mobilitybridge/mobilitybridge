import { useTranslation } from 'react-i18next';

export default function LanguageSwitch() {
  const { t, i18n } = useTranslation();
  const next = i18n.language === 'ar' ? 'en' : 'ar';
  return (
    <button className="rounded border px-3 py-1 text-sm" onClick={() => void i18n.changeLanguage(next)}>
      {t('common.switchLanguage')}
    </button>
  );
}
