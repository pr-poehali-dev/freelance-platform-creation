import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Order, User } from './projectsSectionTypes';

interface AllOrdersTabProps {
  orders: Order[];
  respondedOrders: Order[];
  user: User | null;
  onViewUserProfile: (userId: number) => void;
  onStartChat: (userId: number, orderId: number) => void;
  onRespondToOrder: (orderId: number, orderTitle: string) => void;
}

const AllOrdersTab = ({
  orders,
  respondedOrders,
  user,
  onViewUserProfile,
  onStartChat,
  onRespondToOrder,
}: AllOrdersTabProps) => {
  const visibleOrders = orders
    .filter((o) => o.status !== 'in_progress' || respondedOrders.some((r) => r.id === o.id))
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {visibleOrders.map((order) => {
        const alreadyResponded = respondedOrders.some((r) => r.id === order.id);
        return (
          <Card
            key={order.id}
            className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 gradient-card"
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge className="gradient-primary text-white border-0">{order.category}</Badge>
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
            <CardContent>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => user ? onStartChat(order.user_id, order.id) : null}
                    disabled={!user}
                  >
                    <Icon name="MessageCircle" size={16} className="mr-1" />
                    Написать
                  </Button>
                  {alreadyResponded ? (
                    <Button size="sm" variant="outline" disabled>
                      Откликнулся
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gradient-primary text-white border-0"
                      onClick={() => user ? onRespondToOrder(order.id, order.title) : null}
                      disabled={!user}
                    >
                      Откликнуться
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {orders.length === 0 && (
        <div className="col-span-2 text-center py-12 text-muted-foreground">
          <p className="text-lg">Заказов пока нет</p>
        </div>
      )}
    </div>
  );
};

export default AllOrdersTab;
