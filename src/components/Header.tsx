import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import type { UserRole } from '@/hooks/useIndexState';
import type { Theme } from '@/hooks/useTheme';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  balance?: number;
}

interface HeaderProps {
  user: User | null;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onShowProfile: () => void;
  onShowAuth: () => void;
  onCreateOrder: () => void;
  onShowChats: () => void;
  onShowWallet: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const THEMES: { id: Theme; label: string; icon: string; colors: string }[] = [
  {
    id: 'default',
    label: 'Фиолетовая',
    icon: '🟣',
    colors: 'bg-white border-purple-300',
  },
  {
    id: 'dark',
    label: 'Тёмная',
    icon: '🌑',
    colors: 'bg-slate-900 border-slate-600',
  },
  {
    id: 'yandex',
    label: 'Яндекс',
    icon: '🟡',
    colors: 'bg-white border-yellow-400',
  },
];

const Header = ({
  user,
  userRole,
  onRoleChange,
  onShowProfile,
  onShowAuth,
  onCreateOrder,
  onShowChats,
  onShowWallet,
  theme,
  onThemeChange,
}: HeaderProps) => {
  const isFreelancer = userRole === 'freelancer';
  const [themeOpen, setThemeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gradient">Try-its</h1>
          <nav className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowWallet}
                  className="flex items-center gap-2 gradient-card border"
                >
                  <Icon name="Wallet" size={18} />
                  <span className="text-sm font-bold text-gradient">
                    {user.balance !== undefined ? user.balance.toLocaleString() : '0'} ₽
                  </span>
                </Button>
                <Button variant="ghost" size="sm" onClick={onShowChats} className="relative">
                  <Icon name="MessageCircle" size={20} />
                </Button>

                <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => onRoleChange('client')}
                    className={`py-1 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      !isFreelancer
                        ? 'bg-card shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Заказчик
                  </button>
                  <button
                    type="button"
                    onClick={() => onRoleChange('freelancer')}
                    className={`py-1 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      isFreelancer
                        ? 'bg-card shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Исполнитель
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowProfile}
                  className="flex items-center gap-2"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="gradient-primary text-white text-sm">
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name}</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={onShowAuth}>
                Войти
              </Button>
            )}

            {!isFreelancer && (
              <Button size="sm" className="gradient-primary text-white border-0" onClick={onCreateOrder}>
                Разместить заказ
              </Button>
            )}

            {/* Кнопка смены темы */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setThemeOpen((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors text-lg"
                title="Сменить тему"
              >
                {current.icon}
              </button>

              {themeOpen && (
                <div className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-xl py-1.5 min-w-[160px] z-50">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { onThemeChange(t.id); setThemeOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left ${
                        theme === t.id ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span>{t.label}</span>
                      {theme === t.id && <Icon name="Check" size={14} className="ml-auto text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
