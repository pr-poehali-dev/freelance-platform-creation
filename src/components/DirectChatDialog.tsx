import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const DIRECT_CHAT_URL = 'https://functions.poehali.dev/490f681c-d260-4279-9c75-81ba262325bd';

interface DirectMessage {
  id: number;
  direct_chat_id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

interface DirectChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: number;
  otherUserName: string;
  currentUserId: number;
}

const DirectChatDialog = ({
  open,
  onOpenChange,
  otherUserId,
  otherUserName,
  currentUserId,
}: DirectChatDialogProps) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && otherUserId) {
      initChat();
    }
  }, [open, otherUserId]);

  useEffect(() => {
    if (!open || !chatId) return;
    const interval = setInterval(() => {
      loadMessages(chatId);
    }, 3000);
    return () => clearInterval(interval);
  }, [open, chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initChat = async () => {
    setLoading(true);
    try {
      const res = await fetch(DIRECT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId.toString() },
        body: JSON.stringify({ action: 'create', other_user_id: otherUserId }),
      });
      const data = await res.json();
      if (data.chat_id) {
        setChatId(data.chat_id);
        loadMessages(data.chat_id);
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось открыть чат', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id: number) => {
    try {
      const res = await fetch(`${DIRECT_CHAT_URL}?action=messages&chat_id=${id}`, {
        headers: { 'X-User-Id': currentUserId.toString() },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      console.error('Ошибка загрузки сообщений');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 1024) {
      toast({ title: 'Файл слишком большой', description: 'Максимальный размер — 1 ГБ', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !chatId) return;

    setSending(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (selectedFile) {
        fileName = selectedFile.name;
        fileType = selectedFile.type || 'application/octet-stream';

        const presignRes = await fetch(
          `${DIRECT_CHAT_URL}?action=presign&file_name=${encodeURIComponent(fileName)}&file_type=${encodeURIComponent(fileType)}`,
          { headers: { 'X-User-Id': currentUserId.toString() } }
        );
        const presignData = await presignRes.json();

        await fetch(presignData.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': fileType },
          body: selectedFile,
        });

        fileUrl = presignData.cdn_url;
      }

      const res = await fetch(DIRECT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId.toString() },
        body: JSON.stringify({
          action: 'send',
          chat_id: chatId,
          message: newMessage.trim(),
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, { ...data.message, sender_name: 'Вы' }]);
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const isImage = (type: string | null) => type?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="gradient-primary text-white">
                {otherUserName.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{otherUserName}</DialogTitle>
              <p className="text-sm text-muted-foreground">Фрилансер</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {loading && (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
                <p>Загрузка чата...</p>
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Начните общение с {otherUserName}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[70%]">
                    {!isOwn && (
                      <p className="text-xs text-muted-foreground mb-1 px-3">{msg.sender_name}</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'gradient-primary text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
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
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
              <Icon name="Paperclip" size={14} />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              title="Прикрепить файл"
            >
              <Icon name="Paperclip" size={18} />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || sending}
              className="gradient-primary text-white border-0"
            >
              {sending ? <Icon name="Loader2" size={20} className="animate-spin" /> : <Icon name="Send" size={20} />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DirectChatDialog;