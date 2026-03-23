import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order, User } from './projectsSectionTypes';

interface OrderCardProps {
  order: Order;
  user: User | null;
  isFreelancer: boolean;
  onViewUserProfile: (userId: number) => void;
  onStartChat: (userId: number, orderId: number) => void;
  onRespondToOrder: (orderId: number, orderTitle: string) => void;
  onViewResponses: (orderId: number, orderTitle: string) => void;
  onCompleteOrder: (orderId: number) => void;
  onDeleteOrder: (orderId: number) => void;
}

const OrderCard = ({
  order,
  user,
  isFreelancer,
  onViewUserProfile,
  onStartChat,
  onRespondToOrder,
  onViewResponses,
  onCompleteOrder,
  onDeleteOrder,
}: OrderCardProps) => {
  const isOwner = user && user.id === order.user_id;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 gradient-card">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className="gradient-primary text-white border-0">
              {order.category}
            </Badge>
            {isFreelancer && order.response_status === 'rejected' ? (
              <Badge className="bg-red-500 text-white">Отклонен</Badge>
            ) : order.status === 'in_progress' && (
              <Badge className="bg-blue-500 text-white">В работе</Badge>
            )}
          </div>
          {order.budget_min && order.budget_max && (
            <span className="text-2xl font-bold text-gradient">
              {order.budget_min.toLocaleString()} - {order.budget_max.toLocaleString()} ₽
            </span>
          )}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {order.title}
        </CardTitle>
        <CardDescription className="text-base">{order.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            {order.deadline && (
              <span className="flex items-center gap-1">
                <Icon name="Clock" size={16} />
                до {new Date(order.deadline).toLocaleDateString('ru-RU')}
              </span>
            )}
            <button
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
              onClick={() => onViewUserProfile(order.user_id)}
            >
              <Icon name="User" size={16} />
              {order.user_name}
            </button>
          </div>
          <div className="flex gap-2">
            {isOwner ? (
              <>
                {order.status === 'in_progress' ? (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-0"
                    onClick={() => onCompleteOrder(order.id)}
                  >
                    <Icon name="CheckCircle" size={16} className="mr-1" />
                    Подтвердить выполнение
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewResponses(order.id, order.title)}
                  >
                    <Icon name="Users" size={16} className="mr-1" />
                    Отклики
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeleteOrder(order.id)}
                >
                  <Icon name="Trash2" size={16} className="mr-1" />
                  Удалить
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => user ? onStartChat(order.user_id, order.id) : null}
                  disabled={!user}
                >
                  <Icon name="MessageCircle" size={16} className="mr-1" />
                  Написать
                </Button>
                <Button
                  size="sm"
                  className="gradient-primary text-white border-0"
                  onClick={() => user ? onRespondToOrder(order.id, order.title) : null}
                  disabled={!user}
                >
                  Откликнуться
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
          <div className="flex items-center gap-2 text-amber-700">
            <Icon name="HeadphonesIcon" size={15} />
            <span className="font-medium">Нужна помощь с заказом?</span>
            <span className="text-amber-600 hidden sm:inline">Наша техподдержка поможет</span>
          </div>
          <span className="flex items-center gap-1 text-amber-700 font-semibold whitespace-nowrap opacity-50 cursor-not-allowed">
            <Icon name="MessageSquare" size={14} />
            Написать
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
