'use client';

import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const languages = [
  {
    code: 'pt',
    name: 'Português',
    flag: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 700"
        className="h-4 w-6 rounded-sm"
      >
        <rect width="1000" height="700" fill="#009c3b" />
        <path d="M500 80L920 350 500 620 80 350z" fill="#ffdf00" />
        <circle cx="500" cy="350" r="175" fill="#002776" />
      </svg>
    ),
  },
  {
    code: 'es',
    name: 'Español',
    flag: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 750 500"
        className="h-4 w-6 rounded-sm"
      >
        <rect width="750" height="500" fill="#c60b1e" />
        <rect y="125" width="750" height="250" fill="#ffc400" />
      </svg>
    ),
  },
  {
    code: 'en',
    name: 'English',
    flag: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 30"
        className="h-4 w-6 rounded-sm"
      >
        <clipPath id="uk-a">
          <path d="M0 0v30h60V0z" />
        </clipPath>
        <path d="M0 0v30h60V0z" fill="#012169" />
        <g clipPath="url(#uk-a)">
          <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
          <path d="M0 0l60 30m0-30L0 30" stroke="#C8102E" strokeWidth="4" />
          <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
          <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
        </g>
      </svg>
    ),
  },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'pt' | 'es' | 'en')}
            className={cn('cursor-pointer', {
              'bg-accent': language === lang.code,
            })}
          >
            <div className="flex items-center gap-2">
              {lang.flag}
              <span>{lang.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
