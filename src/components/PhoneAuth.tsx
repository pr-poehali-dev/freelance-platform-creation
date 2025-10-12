import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface PhoneAuthProps {
  onSuccess: (user: any) => void;
}

const PhoneAuth = ({ onSuccess }: PhoneAuthProps) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 1) return `+${cleaned}`;
    if (cleaned.length <= 11) return `+${cleaned}`;
    return `+${cleaned.slice(0, 11)}`;
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 12) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный номер телефона',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/062feba6-c3fc-4c82-a634-b94a70ceb0a0?action=send-code',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStep('code');
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        toast({
          title: 'Код отправлен!',
          description: data.devCode 
            ? `Код для разработки: ${data.devCode}` 
            : 'Проверьте SMS на вашем телефоне',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить код',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при отправке кода',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: 'Ошибка',
        description: 'Введите 6-значный код',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/062feba6-c3fc-4c82-a634-b94a70ceb0a0?action=verify-code',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code, name: name || 'Пользователь' }),
        }
      );

      const data = await response.json();

      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(data.user);
        toast({
          title: 'Добро пожаловать!',
          description: `Вы успешно вошли как ${data.user.name}`,
        });
      } else {
        toast({
          title: 'Неверный код',
          description: 'Проверьте правильность введенного кода',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при проверке кода',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <div className="space-y-4 w-full">
        <div className="space-y-2">
          <Label htmlFor="phone">Номер телефона</Label>
          <div className="relative">
            <Icon name="Phone" className="absolute left-3 top-3 text-muted-foreground" size={20} />
            <Input
              id="phone"
              type="tel"
              placeholder="+7 999 123 45 67"
              className="pl-10"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              maxLength={15}
            />
          </div>
        </div>
        <Button
          onClick={handleSendCode}
          disabled={loading}
          className="w-full gradient-primary text-white border-0"
        >
          {loading ? 'Отправка...' : 'Получить код'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="name">Ваше имя</Label>
        <div className="relative">
          <Icon name="User" className="absolute left-3 top-3 text-muted-foreground" size={20} />
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
        <Label htmlFor="code">Код из SMS</Label>
        <div className="relative">
          <Icon name="Lock" className="absolute left-3 top-3 text-muted-foreground" size={20} />
          <Input
            id="code"
            type="text"
            placeholder="123456"
            className="pl-10 text-center text-2xl tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
        </div>
        {devCode && (
          <p className="text-xs text-muted-foreground text-center">
            Код для разработки: <span className="font-bold text-primary">{devCode}</span>
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setStep('phone');
            setCode('');
            setDevCode('');
          }}
          className="w-full"
        >
          Назад
        </Button>
        <Button
          onClick={handleVerifyCode}
          disabled={loading}
          className="w-full gradient-primary text-white border-0"
        >
          {loading ? 'Проверка...' : 'Войти'}
        </Button>
      </div>
    </div>
  );
};

export default PhoneAuth;
