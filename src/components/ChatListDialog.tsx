import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface Chat {
  chat_id: number;
  order_id: number;
  order_title: string;
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
}

interface ChatListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onOpenChat: (chatId: number, otherUserId: number, otherUserName: string) => void;
}

const ChatListDialog = ({ open, onOpenChange, userId, onOpenChat }: ChatListDialogProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadChats();
    }
  }, [open]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/860360d2-628f-438b-b4af-a6be44d35b25?action=list',
        {
          headers: {
            'X-User-Id': userId.toString(),
          },
        }
      );

      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-2xl">Мои сообщения</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Icon name="MessageCircle" size={64} className="mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">У вас пока нет сообщений</h3>
              <p className="text-muted-foreground">
                Начните общение с заказчиками или фрилансерами через заказы
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {chats.map((chat) => (
                <button
                  key={chat.chat_id}
                  onClick={() => onOpenChat(chat.chat_id, chat.other_user_id, chat.other_user_name)}
                  className="w-full px-6 py-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 mt-1">
                      <AvatarFallback className="gradient-primary text-white font-bold">
                        {chat.other_user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold truncate">{chat.other_user_name}</h4>
                        {chat.last_message_time && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(chat.last_message_time).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs mb-2">
                        {chat.order_title}
                      </Badge>
                      {chat.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ChatListDialog;
