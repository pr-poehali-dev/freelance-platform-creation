import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface ResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderTitle: string;
  userId: number;
  onSuccess: () => void;
}

const ResponseDialog = ({
  open,
  onOpenChange,
  orderId,
  orderTitle,
  userId,
  onSuccess,
}: ResponseDialogProps) => {
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Напишите сообщение о вашем отклике',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/398a8b33-64ba-4a3b-be92-18cc1971a490', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({
          order_id: orderId,
          message: message.trim(),
          proposed_price: proposedPrice ? parseInt(proposedPrice) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Отклик отправлен!',
          description: 'Заказчик увидит ваш отклик и сможет связаться с вами',
        });
        setMessage('');
        setProposedPrice('');
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить отклик',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при отправке отклика',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Откликнуться на заказ</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">{orderTitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="message">Сопроводительное сообщение *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Расскажите, почему вы подходите для этого заказа, какой у вас опыт..."
              rows={6}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="price">Предложите свою цену (необязательно)</Label>
            <Input
              id="price"
              type="number"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              placeholder="50000"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Укажите стоимость выполнения заказа в рублях
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 gradient-primary text-white border-0"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} className="mr-2" />
                  Отправить отклик
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResponseDialog;
