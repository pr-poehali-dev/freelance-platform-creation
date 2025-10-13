import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface LoginAuthProps {
  onSuccess: (user: any) => void;
}

const LoginAuth = ({ onSuccess }: LoginAuthProps) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!username || !password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните логин и пароль',
        variant: 'destructive',
      });
      return;
    }

    if (isRegister && password.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть не менее 6 символов',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const action = isRegister ? 'register' : 'login';

    try {
      const response = await fetch(
        `https://functions.poehali.dev/062feba6-c3fc-4c82-a634-b94a70ceb0a0?action=${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            ...(isRegister && { name: name || username, email }),
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(data.user);
        toast({
          title: isRegister ? 'Регистрация успешна!' : 'Добро пожаловать!',
          description: `Вы вошли как ${data.user.name}`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось войти',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при авторизации',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="username">Логин</Label>
        <div className="relative">
          <Icon name="User" className="absolute left-3 top-3 text-muted-foreground" size={20} />
          <Input
            id="username"
            type="text"
            placeholder="Введите логин"
            className="pl-10"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Icon name="Lock" className="absolute left-3 top-3 text-muted-foreground" size={20} />
          <Input
            id="password"
            type="password"
            placeholder="Введите пароль"
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {isRegister && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Имя (необязательно)</Label>
            <div className="relative">
              <Icon name="UserCircle" className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                id="name"
                type="text"
                placeholder="Как к вам обращаться?"
                className="pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (необязательно)</Label>
            <div className="relative">
              <Icon name="Mail" className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full gradient-primary text-white border-0"
      >
        {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-primary hover:underline"
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
};

export default LoginAuth;
