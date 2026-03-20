import ChatListDialog from '@/components/ChatListDialog';
import ChatDialog from '@/components/ChatDialog';
import DirectChatDialog from '@/components/DirectChatDialog';
import { User } from '@/hooks/useIndexState';

interface IndexChatDialogsProps {
  user: User | null;
  showChatListDialog: boolean;
  setShowChatListDialog: (v: boolean) => void;
  showChatDialog: boolean;
  setShowChatDialog: (v: boolean) => void;
  activeChatId: number | null;
  activeChatUser: { id: number; name: string } | null;
  activeChatOrderId: number | null;
  showDirectChatDialog: boolean;
  setShowDirectChatDialog: (v: boolean) => void;
  directChatUser: { id: number; name: string } | null;
  onOpenChatFromList: (chatId: number, otherUserId: number, otherUserName: string) => void;
}

const IndexChatDialogs = ({
  user,
  showChatListDialog,
  setShowChatListDialog,
  showChatDialog,
  setShowChatDialog,
  activeChatId,
  activeChatUser,
  activeChatOrderId,
  showDirectChatDialog,
  setShowDirectChatDialog,
  directChatUser,
  onOpenChatFromList,
}: IndexChatDialogsProps) => {
  if (!user) return null;

  return (
    <>
      <ChatListDialog
        open={showChatListDialog}
        onOpenChange={setShowChatListDialog}
        userId={user.id}
        onOpenChat={onOpenChatFromList}
      />

      <ChatDialog
        open={showChatDialog}
        onOpenChange={setShowChatDialog}
        chatId={activeChatId}
        otherUser={activeChatUser}
        currentUserId={user.id}
        orderId={activeChatOrderId || undefined}
      />

      {directChatUser && (
        <DirectChatDialog
          open={showDirectChatDialog}
          onOpenChange={setShowDirectChatDialog}
          otherUserId={directChatUser.id}
          otherUserName={directChatUser.name}
          currentUserId={user.id}
        />
      )}
    </>
  );
};

export default IndexChatDialogs;
