import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import type { UserRole } from '@/hooks/useIndexState';

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
}

const Header = ({
  user,
  userRole,
  onRoleChange,
  onShowProfile,
  onShowAuth,
  onCreateOrder,
  onShowChats,
  onShowWallet,
}: HeaderProps) => {
  const isFreelancer = userRole === 'freelancer';

  return (
    <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
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

                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => onRoleChange('client')}
                    className={`py-1 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      !isFreelancer
                        ? 'bg-white shadow text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Заказчик
                  </button>
                  <button
                    type="button"
                    onClick={() => onRoleChange('freelancer')}
                    className={`py-1 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      isFreelancer
                        ? 'bg-white shadow text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
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
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
