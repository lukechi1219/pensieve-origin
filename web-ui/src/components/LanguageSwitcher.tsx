import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh_Hant' : 'en');
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title={locale === 'en' ? 'Switch to 繁體中文' : 'Switch to English'}
    >
      <Languages className="w-4 h-4" />
      <span className="font-medium">{locale === 'en' ? 'EN' : '繁中'}</span>
    </button>
  );
}
