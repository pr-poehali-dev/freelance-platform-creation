import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import EditOrderDialog from '@/components/EditOrderDialog';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface Order {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  user_id: number;
  user_name: string;
  status: string;
  created_at: string;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

const ProfileDialog = ({ open, onOpenChange, user, onLogout }: ProfileDialogProps) => {
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      loadMyOrders();
    }
  }, [open, user]);

  const loadMyOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/2862d449-505a-4b67-970b-db34c9334ed0?user_id=${user.id}`
      );
      const data = await response.json();
      setMyOrders(data.orders || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить ваши заказы',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://functions.poehali.dev/80aa9980-d113-4b04-b84f-7820d7ddb3fd?order_id=${orderId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString(),
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Заказ удален',
          description: 'Ваш заказ успешно удален',
        });
        loadMyOrders();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить заказ',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при удалении заказа',
        variant: 'destructive',
      });
    }
  };

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      design: 'Дизайн',
      development: 'Разработка',
      marketing: 'Маркетинг',
      video: 'Видео',
      writing: 'Копирайтинг',
    };
    return categories[category] || category;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Личный кабинет</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon name="User" size={24} />
                  Профиль
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user?.name || 'Пользователь'}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email || user?.phone}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={onLogout} className="w-full">
                  <Icon name="LogOut" size={18} className="mr-2" />
                  Выйти из аккаунта
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon name="Briefcase" size={24} />
                  Мои заказы
                </CardTitle>
                <CardDescription>
                  Управляйте своими размещенными заказами
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Icon name="Loader2" size={32} className="animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="FileQuestion" size={48} className="mx-auto mb-3 opacity-50" />
                    <p>У вас пока нет размещенных заказов</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myOrders.map((order) => (
                      <Card key={order.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-2">{order.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {order.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge variant="secondary">
                                    {getCategoryName(order.category)}
                                  </Badge>
                                  {order.tags?.map((tag: string, idx: number) => (
                                    <Badge key={idx} variant="outline">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Icon name="DollarSign" size={16} />
                                    {order.budget}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Icon name="Calendar" size={16} />
                                    {order.deadline}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Icon name="Users" size={16} />
                                    {order.proposals || 0} откликов
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingOrder(order)}
                                className="flex-1"
                              >
                                <Icon name="Pencil" size={16} className="mr-2" />
                                Редактировать
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteOrder(order.id)}
                                className="flex-1"
                              >
                                <Icon name="Trash2" size={16} className="mr-2" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {editingOrder && (
        <EditOrderDialog
          open={!!editingOrder}
          onOpenChange={(open) => !open && setEditingOrder(null)}
          order={editingOrder}
          onSuccess={() => {
            loadMyOrders();
            setEditingOrder(null);
          }}
        />
      )}
    </>
  );
};

export default ProfileDialog;