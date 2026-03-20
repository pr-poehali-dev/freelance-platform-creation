import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CHAT_URL = 'https://functions.poehali.dev/860360d2-628f-438b-b4af-a6be44d35b25';

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
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  edited_at: string | null;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId.toString() },
        body: JSON.stringify({ action: 'create', order_id: orderId, other_user_id: otherUser.id }),
      });
      const data = await response.json();
      if (data.chat_id) {
        setActiveChatId(data.chat_id);
        loadMessages(data.chat_id);
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось создать чат', variant: 'destructive' });
    }
  };

  const loadMessages = async (chat_id: number) => {
    try {
      const response = await fetch(`${CHAT_URL}?action=messages&chat_id=${chat_id}`, {
        headers: { 'X-User-Id': currentUserId.toString() },
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch {
      console.error('Ошибка загрузки сообщений');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Файл слишком большой', description: 'Максимальный размер — 10 МБ', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeChatId) return;

    setLoading(true);
    try {
      let fileData: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (selectedFile) {
        const buffer = await selectedFile.arrayBuffer();
        fileData = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        fileName = selectedFile.name;
        fileType = selectedFile.type;
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId.toString() },
        body: JSON.stringify({
          action: 'send',
          chat_id: activeChatId,
          message: newMessage.trim(),
          file_data: fileData,
          file_name: fileName,
          file_type: fileType,
        }),
      });
      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, { ...data.message, sender_name: 'Вы' }]);
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (messageId: number) => {
    if (!editText.trim()) return;
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId.toString() },
        body: JSON.stringify({ action: 'edit', message_id: messageId, message: editText.trim() }),
      });
      const data = await response.json();
      if (data.message) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...data.message } : m)));
        cancelEdit();
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить изменения', variant: 'destructive' });
    }
  };

  const isImage = (type: string | null) => type?.startsWith('image/');

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
              const isEditing = editingId === msg.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <p className="text-xs text-muted-foreground mb-1 px-3">{msg.sender_name}</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'gradient-primary text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="text-sm bg-white/20 border-white/40 text-white placeholder:text-white/60"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id); }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => saveEdit(msg.id)} className="h-6 px-2 text-xs text-white hover:bg-white/20">
                              <Icon name="Check" size={12} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 px-2 text-xs text-white hover:bg-white/20">
                              <Icon name="X" size={12} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.message && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          )}
                          {msg.file_url && (
                            <div className="mt-2">
                              {isImage(msg.file_type) ? (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={msg.file_url}
                                    alt={msg.file_name || 'изображение'}
                                    className="max-w-full rounded-lg max-h-48 object-contain cursor-pointer"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={msg.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 text-sm underline ${isOwn ? 'text-white/90' : 'text-primary'}`}
                                >
                                  <Icon name="Paperclip" size={14} />
                                  {msg.file_name || 'Файл'}
                                </a>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          {msg.edited_at && ' (изменено)'}
                        </p>
                        {isOwn && !isEditing && !msg.file_url && (
                          <button
                            onClick={() => startEdit(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-white/60 hover:text-white/90"
                          >
                            <Icon name="Pencil" size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="border-t px-6 py-4 space-y-2">
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2">
              <Icon name="Paperclip" size={14} className="text-muted-foreground" />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                <Icon name="X" size={14} className="text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Прикрепить файл"
            >
              <Icon name="Paperclip" size={18} />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || loading}
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
