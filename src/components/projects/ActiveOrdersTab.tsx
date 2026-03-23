import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import OrderCard from './OrderCard';
import type { Order, User } from './projectsSectionTypes';

interface ActiveOrdersTabProps {
  displayOrders: Order[];
  noExactResults: boolean;
  similarOrders: Order[];
  isFreelancer: boolean;
  user: User | null;
  onCreateOrder: () => void;
  onSetActiveTab: (tab: string) => void;
  onViewUserProfile: (userId: number) => void;
  onStartChat: (userId: number, orderId: number) => void;
  onRespondToOrder: (orderId: number, orderTitle: string) => void;
  onViewResponses: (orderId: number, orderTitle: string) => void;
  onCompleteOrder: (orderId: number) => void;
  onDeleteOrder: (orderId: number) => void;
}

const ActiveOrdersTab = ({
  displayOrders,
  noExactResults,
  similarOrders,
  isFreelancer,
  user,
  onCreateOrder,
  onSetActiveTab,
  onViewUserProfile,
  onStartChat,
  onRespondToOrder,
  onViewResponses,
  onCompleteOrder,
  onDeleteOrder,
}: ActiveOrdersTabProps) => {
  return (
    <>
      {noExactResults && (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-base mb-1">Заказов на данную тему нет</p>
          {similarOrders.length > 0 && (
            <p className="text-sm text-muted-foreground">Вот заказы из похожих сфер:</p>
          )}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {displayOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            user={user}
            isFreelancer={isFreelancer}
            onViewUserProfile={onViewUserProfile}
            onStartChat={onStartChat}
            onRespondToOrder={onRespondToOrder}
            onViewResponses={onViewResponses}
            onCompleteOrder={onCompleteOrder}
            onDeleteOrder={onDeleteOrder}
          />
        ))}
        {displayOrders.length === 0 && !noExactResults && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <p className="text-lg mb-4">
              {isFreelancer ? 'Вы ещё не откликались на заказы' : 'Пока нет активных заказов'}
            </p>
            {isFreelancer ? (
              <Button onClick={() => onSetActiveTab('all-orders')} className="gradient-primary text-white border-0">
                Найти первый заказ
              </Button>
            ) : (
              <Button onClick={onCreateOrder} className="gradient-primary text-white border-0">
                Разместить первый заказ
              </Button>
            )}
          </div>
        )}
        {noExactResults && similarOrders.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg">Заказов не найдено</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ActiveOrdersTab;
