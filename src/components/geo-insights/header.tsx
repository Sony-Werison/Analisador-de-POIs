'use client';

import { useTranslations } from '@/lib/translations';
import LanguageToggle from './language-toggle';
import ThemeToggle from './theme-toggle';

export default function Header() {
  const { t } = useTranslations();

  return (
    <header className="mb-8">
      <div className="flex justify-between items-start">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground break-words">
            {t('main_title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('main_subtitle')}</p>
        </div>
        <div className="flex space-x-2 items-center flex-shrink-0 pt-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
