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

interface ActiveFreelancersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  orderTitle: string;
  userId: number;
  onOrderCompleted: () => void;
}

const ActiveFreelancersDialog = ({
  open,
  onOpenChange,
  orderId,
  orderTitle,
  userId,
  onOrderCompleted,
}: ActiveFreelancersDialogProps) => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);
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
        { headers: { 'X-User-Id': userId.toString() } }
      );
      const data = await response.json();
      const active = (data.responses || []).filter(
        (r: Response) => r.status === 'accepted' || r.status === 'completed'
      );
      setResponses(active);
    } catch {
      console.error('Ошибка загрузки фрилансеров');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (responseId: number) => {
    setCompleting(responseId);
    try {
      const response = await fetch('https://functions.poehali.dev/398a8b33-64ba-4a3b-be92-18cc1971a490', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({ response_id: responseId, action: 'complete' }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'Заказ завершён!',
          description: 'Проект засчитан фрилансеру в портфолио',
        });
        onOrderCompleted();
        onOpenChange(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось завершить заказ',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Произошла ошибка', variant: 'destructive' });
    } finally {
      setCompleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">Фрилансеры в работе</DialogTitle>
          <p className="text-sm text-muted-foreground">{orderTitle}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 max-h-[480px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            </div>
          ) : responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="Users" size={56} className="mb-4 opacity-40 text-muted-foreground" />
              <p className="text-muted-foreground">Нет фрилансеров в работе по этому заказу</p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((resp) => (
                <div
                  key={resp.id}
                  className={`border rounded-lg p-4 ${
                    resp.status === 'completed' ? 'border-green-400 bg-green-50' : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className="gradient-primary text-white font-bold">
                        {resp.freelancer_name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div>
                          <h4 className="font-semibold">{resp.freelancer_name}</h4>
                          <p className="text-sm text-muted-foreground">@{resp.freelancer_username}</p>
                        </div>
                        {resp.status === 'completed' ? (
                          <Badge className="bg-green-500 text-white shrink-0">Выполнено</Badge>
                        ) : (
                          <Badge className="bg-blue-500 text-white shrink-0">В работе</Badge>
                        )}
                      </div>

                      {resp.message && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{resp.message}</p>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {resp.proposed_price && (
                            <span className="font-semibold text-primary">
                              {resp.proposed_price.toLocaleString()} ₽
                            </span>
                          )}
                          <span>
                            {new Date(resp.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                        </div>

                        {resp.status === 'accepted' && (
                          <Button
                            size="sm"
                            className="gradient-primary text-white border-0 shrink-0"
                            onClick={() => handleComplete(resp.id)}
                            disabled={completing === resp.id}
                          >
                            {completing === resp.id ? (
                              <Icon name="Loader2" size={14} className="mr-1 animate-spin" />
                            ) : (
                              <Icon name="CheckCircle" size={14} className="mr-1" />
                            )}
                            Заказ завершён
                          </Button>
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

export default ActiveFreelancersDialog;
