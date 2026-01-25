'use client';

import { useTheme, type Theme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Sun, Moon, Sprout, Waves, Sunset, Trees } from 'lucide-react';

const themeIcons: Record<Theme, React.ComponentType<{ className?: string }>> = {
  garden: Sprout,
  ocean: Waves,
  sunset: Sunset,
  forest: Trees,
};

const themeLabels: Record<Theme, string> = {
  garden: 'Garden',
  ocean: 'Ocean',
  sunset: 'Sunset',
  forest: 'Forest',
};

const themeDescriptions: Record<Theme, string> = {
  garden: 'Зеленая теплая палитра',
  ocean: 'Синяя прохладная палитра',
  sunset: 'Оранжево-красная палитра',
  forest: 'Темно-зеленая глубокая палитра',
};

export function ThemeSwitcher() {
  const { theme, mode, setTheme, toggleMode, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Palette className="h-5 w-5" />
      </Button>
    );
  }

  const themes: Theme[] = ['garden', 'ocean', 'sunset', 'forest'];

  return (
    <div className="flex items-center gap-2">
      {/* Theme selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Palette className="h-5 w-5" />
            <span className="sr-only">Выбрать тему</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Выберите тему</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map((t) => {
            const Icon = themeIcons[t];
            return (
              <DropdownMenuItem
                key={t}
                onClick={() => setTheme(t)}
                className={theme === t ? 'bg-accent' : ''}
              >
                <Icon className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{themeLabels[t]}</span>
                  <span className="text-xs text-muted-foreground">
                    {themeDescriptions[t]}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Light/Dark mode toggle */}
      <Button variant="ghost" size="icon" onClick={toggleMode}>
        {mode === 'light' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
        <span className="sr-only">Переключить режим</span>
      </Button>
    </div>
  );
}
