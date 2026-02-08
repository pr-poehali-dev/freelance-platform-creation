import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Response {
  id: number;
  order_id: number;
  freelancer_id: number;
  freelancer_name: string;
  freelancer_username: string;
  message: string;
  proposed_price: number | null;
  status: string;
  created_at: string;
}

interface OrderResponsesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  orderTitle: string;
  userId: number;
  onResponseAccepted: () => void;
}

const OrderResponsesDialog = ({
  open,
  onOpenChange,
  orderId,
  orderTitle,
  userId,
  onResponseAccepted,
}: OrderResponsesDialogProps) => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      loadResponses();
    }
  }, [open, orderId]);

  const loadResponses = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/398a8b33-64ba-4a3b-be92-18cc1971a490?order_id=${orderId}`,
        {
          headers: {
            'X-User-Id': userId.toString(),
          },
        }
      );

      const data = await response.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Ошибка загрузки откликов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (responseId: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/398a8b33-64ba-4a3b-be92-18cc1971a490', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({
          response_id: responseId,
          action: 'accept',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Отклик принят!',
          description: 'Заказ переведен в статус "В работе"',
        });
        onResponseAccepted();
        onOpenChange(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось принять отклик',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (responseId: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/398a8b33-64ba-4a3b-be92-18cc1971a490', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({
          response_id: responseId,
          action: 'reject',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Отклик отклонен',
        });
        loadResponses();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отклонить отклик',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-2xl">Отклики на заказ</DialogTitle>
          <p className="text-sm text-muted-foreground">{orderTitle}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            </div>
          ) : responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="Users" size={64} className="mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Пока нет откликов</h3>
              <p className="text-muted-foreground">
                Фрилансеры смогут откликнуться на ваш заказ
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((resp) => (
                <div
                  key={resp.id}
                  className={`border rounded-lg p-4 ${
                    resp.status === 'accepted'
                      ? 'border-green-500 bg-green-50'
                      : resp.status === 'rejected'
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="gradient-primary text-white font-bold">
                        {resp.freelancer_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{resp.freelancer_name}</h4>
                          <p className="text-sm text-muted-foreground">@{resp.freelancer_username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {resp.status === 'accepted' && (
                            <Badge className="bg-green-500">Принят</Badge>
                          )}
                          {resp.status === 'rejected' && (
                            <Badge variant="secondary">Отклонен</Badge>
                          )}
                          {resp.status === 'pending' && (
                            <Badge variant="outline">Ожидает</Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm mb-3 whitespace-pre-wrap">{resp.message}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {resp.proposed_price && (
                            <span className="font-semibold text-primary text-base">
                              {resp.proposed_price.toLocaleString()} ₽
                            </span>
                          )}
                          <span>
                            {new Date(resp.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {resp.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="gradient-primary text-white border-0"
                              onClick={() => handleAccept(resp.id)}
                            >
                              <Icon name="Check" size={16} className="mr-1" />
                              Принять
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(resp.id)}
                            >
                              <Icon name="X" size={16} className="mr-1" />
                              Отклонить
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OrderResponsesDialog;
