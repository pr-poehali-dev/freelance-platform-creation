import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  created_at: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: number | null;
  otherUser: User | null;
  currentUserId: number;
  orderId?: number;
}

const ChatDialog = ({ open, onOpenChange, chatId, otherUser, currentUserId, orderId }: ChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(chatId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && chatId) {
      setActiveChatId(chatId);
      loadMessages(chatId);
    }
  }, [open, chatId]);

  useEffect(() => {
    if (open && !chatId && otherUser && orderId) {
      createChat();
    }
  }, [open, chatId, otherUser, orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createChat = async () => {
    if (!otherUser || !orderId) return;

    try {
      const response = await fetch('https://functions.poehali.dev/860360d2-628f-438b-b4af-a6be44d35b25', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString(),
        },
        body: JSON.stringify({
          action: 'create',
          order_id: orderId,
          other_user_id: otherUser.id,
        }),
      });

      const data = await response.json();
      if (data.chat_id) {
        setActiveChatId(data.chat_id);
        loadMessages(data.chat_id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат',
        variant: 'destructive',
      });
    }
  };

  const loadMessages = async (chat_id: number) => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/860360d2-628f-438b-b4af-a6be44d35b25?action=messages&chat_id=${chat_id}`,
        {
          headers: {
            'X-User-Id': currentUserId.toString(),
          },
        }
      );

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/860360d2-628f-438b-b4af-a6be44d35b25', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString(),
        },
        body: JSON.stringify({
          action: 'send',
          chat_id: activeChatId,
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages([...messages, { ...data.message, sender_name: 'Вы' }]);
        setNewMessage('');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!otherUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="gradient-primary text-white">
                {otherUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{otherUser.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">Онлайн</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Начните общение с {otherUser.name}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <p className="text-xs text-muted-foreground mb-1 px-3">{msg.sender_name}</p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'gradient-primary text-white rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-white/70' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="gradient-primary text-white border-0"
            >
              <Icon name="Send" size={20} />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
