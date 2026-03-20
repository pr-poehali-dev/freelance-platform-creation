import UserProfileDialog from '@/components/UserProfileDialog';
import ResponseDialog from '@/components/ResponseDialog';
import OrderResponsesDialog from '@/components/OrderResponsesDialog';
import FreelancerProfileDialog from '@/components/FreelancerProfileDialog';
import WalletDialog from '@/components/WalletDialog';
import { User, Order } from '@/hooks/useIndexState';

interface IndexOrderDialogsProps {
  user: User | null;
  showUserProfileDialog: boolean;
  setShowUserProfileDialog: (v: boolean) => void;
  selectedUserData: User | null;
  selectedUserOrders: Order[];
  showResponseDialog: boolean;
  setShowResponseDialog: (v: boolean) => void;
  showOrderResponsesDialog: boolean;
  setShowOrderResponsesDialog: (v: boolean) => void;
  selectedOrderId: number | null;
  selectedOrderTitle: string;
  showFreelancerProfileDialog: boolean;
  setShowFreelancerProfileDialog: (v: boolean) => void;
  selectedFreelancerId: number | null;
  showWalletDialog: boolean;
  setShowWalletDialog: (v: boolean) => void;
  onStartChat: (userId: number, orderId: number) => void;
  onResponseSuccess: () => void;
  onStartChatWithFreelancer: (userId: number) => void;
  onBalanceUpdate: (newBalance: number) => void;
}

const IndexOrderDialogs = ({
  user,
  showUserProfileDialog,
  setShowUserProfileDialog,
  selectedUserData,
  selectedUserOrders,
  showResponseDialog,
  setShowResponseDialog,
  showOrderResponsesDialog,
  setShowOrderResponsesDialog,
  selectedOrderId,
  selectedOrderTitle,
  showFreelancerProfileDialog,
  setShowFreelancerProfileDialog,
  selectedFreelancerId,
  showWalletDialog,
  setShowWalletDialog,
  onStartChat,
  onResponseSuccess,
  onStartChatWithFreelancer,
  onBalanceUpdate,
}: IndexOrderDialogsProps) => {
  return (
    <>
      <UserProfileDialog
        open={showUserProfileDialog}
        onOpenChange={setShowUserProfileDialog}
        user={selectedUserData}
        currentUser={user}
        userOrders={selectedUserOrders}
        onStartChat={onStartChat}
      />

      {user && selectedOrderId && (
        <>
          <ResponseDialog
            open={showResponseDialog}
            onOpenChange={setShowResponseDialog}
            orderId={selectedOrderId}
            orderTitle={selectedOrderTitle}
            userId={user.id}
            onSuccess={onResponseSuccess}
          />

          <OrderResponsesDialog
            open={showOrderResponsesDialog}
            onOpenChange={setShowOrderResponsesDialog}
            orderId={selectedOrderId}
            orderTitle={selectedOrderTitle}
            userId={user.id}
            onResponseAccepted={onResponseSuccess}
          />
        </>
      )}

      <FreelancerProfileDialog
        open={showFreelancerProfileDialog}
        onOpenChange={setShowFreelancerProfileDialog}
        freelancerId={selectedFreelancerId}
        currentUserId={user?.id || null}
        onStartChat={onStartChatWithFreelancer}
      />

      {user && (
        <WalletDialog
          open={showWalletDialog}
          onOpenChange={setShowWalletDialog}
          userId={user.id}
          initialBalance={user.balance || 0}
          onBalanceUpdate={onBalanceUpdate}
        />
      )}
    </>
  );
};

export default IndexOrderDialogs;
