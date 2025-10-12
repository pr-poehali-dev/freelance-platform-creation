import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthProps {
  onSuccess: (user: any) => void;
}

const GoogleAuth = ({ onSuccess }: GoogleAuthProps) => {
  const { toast } = useToast();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await fetch('https://functions.poehali.dev/062feba6-c3fc-4c82-a634-b94a70ceb0a0?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(data.user);
        toast({
          title: 'Успешный вход!',
          description: `Добро пожаловать, ${data.user.name}!`,
        });
      } else {
        toast({
          title: 'Ошибка входа',
          description: 'Не удалось войти через Google',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при авторизации',
        variant: 'destructive',
      });
    }
  };

  const handleError = () => {
    toast({
      title: 'Ошибка',
      description: 'Не удалось войти через Google',
      variant: 'destructive',
    });
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap
      auto_select
    />
  );
};

export default GoogleAuth;
