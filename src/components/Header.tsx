import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface HeaderProps {
  user: User | null;
  onShowProfile: () => void;
  onShowAuth: () => void;
  onCreateOrder: () => void;
}

const Header = ({ user, onShowProfile, onShowAuth, onCreateOrder }: HeaderProps) => {
  return (
    <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gradient">Try-its</h1>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#projects" className="text-sm font-medium hover:text-primary transition-colors">
              Заказы
            </a>
            <a href="#freelancers" className="text-sm font-medium hover:text-primary transition-colors">
              Фрилансеры
            </a>
            {user ? (
              <>
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
            <Button size="sm" className="gradient-primary text-white border-0" onClick={onCreateOrder}>
              Разместить заказ
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;