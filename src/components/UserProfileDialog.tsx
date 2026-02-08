import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  currentUser: User | null;
  userOrders: Order[];
  onStartChat: (userId: number, orderId: number) => void;
}

const UserProfileDialog = ({
  open,
  onOpenChange,
  user,
  currentUser,
  userOrders,
  onStartChat,
}: UserProfileDialogProps) => {
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
              <p className="text-muted-foreground mb-3">@{user.username}</p>
              {user.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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
                <p className="text-center text-muted-foreground py-8">
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
