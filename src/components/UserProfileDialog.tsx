import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

const REVIEWS_URL = 'https://functions.poehali.dev/44b24f74-a364-4f56-9258-45c0c88b94e5';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface Order {
  id: number;
  title: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  created_at: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  role: 'client' | 'freelancer';
  reviewer_name: string;
  order_title: string;
  created_at: string;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  currentUser: User | null;
  userOrders: Order[];
  onStartChat: (userId: number, orderId: number) => void;
}

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Icon
        key={s}
        name="Star"
        size={14}
        className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

const UserProfileDialog = ({
  open,
  onOpenChange,
  user,
  currentUser,
  userOrders,
  onStartChat,
}: UserProfileDialogProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    if (open && user?.id) {
      fetch(`${REVIEWS_URL}?user_id=${user.id}`, {
        headers: { 'X-User-Id': (currentUser?.id || user.id).toString() },
      })
        .then((r) => r.json())
        .then((data) => {
          setReviews(data.reviews || []);
          setAvgRating(data.avg_rating ?? null);
        })
        .catch(() => {});
    }
  }, [open, user?.id]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Профиль пользователя</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarFallback className="gradient-primary text-white text-3xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">{user.name}</h3>
              <p className="text-muted-foreground mb-2">@{user.username}</p>
              {avgRating !== null && (
                <div className="flex items-center gap-2 mb-2">
                  <Stars rating={Math.round(avgRating)} />
                  <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({reviews.length} отзыв{reviews.length === 1 ? '' : reviews.length < 5 ? 'а' : 'ов'})</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Mail" size={16} />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">
              Активные заказы ({userOrders.length})
            </h4>
            <div className="space-y-3">
              {userOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  У пользователя пока нет активных заказов
                </p>
              ) : (
                userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h5 className="font-semibold mb-1">{order.title}</h5>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="secondary">{order.category}</Badge>
                          {order.budget_min && order.budget_max && (
                            <span className="font-semibold text-primary">
                              {order.budget_min.toLocaleString()} - {order.budget_max.toLocaleString()} ₽
                            </span>
                          )}
                        </div>
                      </div>
                      {currentUser && currentUser.id !== user.id && (
                        <Button
                          size="sm"
                          className="gradient-primary text-white border-0"
                          onClick={() => onStartChat(user.id, order.id)}
                        >
                          <Icon name="MessageCircle" size={16} className="mr-1" />
                          Написать
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {reviews.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Отзывы ({reviews.length})</h4>
              <ScrollArea className="max-h-64">
                <div className="space-y-3 pr-2">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-medium text-sm">{rv.reviewer_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {rv.role === 'client' ? 'заказчик' : 'исполнитель'}
                          </span>
                        </div>
                        <Stars rating={rv.rating} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{rv.order_title}</p>
                      {rv.comment && <p className="text-sm">{rv.comment}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(rv.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentUser && currentUser.id !== user.id && userOrders.length > 0 && (
            <div className="pt-4 border-t">
              <Button
                className="w-full gradient-primary text-white border-0"
                onClick={() => onStartChat(user.id, userOrders[0].id)}
              >
                <Icon name="MessageCircle" size={20} className="mr-2" />
                Начать общение с {user.name}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
