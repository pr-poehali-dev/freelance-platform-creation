import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const REVIEWS_URL = 'https://functions.poehali.dev/44b24f74-a364-4f56-9258-45c0c88b94e5';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedOrderId: number | null;
  orderTitle: string;
  revieweeName: string;
  currentUserId: number;
  role: 'client' | 'freelancer';
  onReviewSubmitted: () => void;
}

const ReviewDialog = ({
  open,
  onOpenChange,
  completedOrderId,
  orderTitle,
  revieweeName,
  currentUserId,
  role,
  onReviewSubmitted,
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!completedOrderId || rating === 0) {
      toast({ title: 'Укажите оценку', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(REVIEWS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId.toString() },
        body: JSON.stringify({ completed_order_id: completedOrderId, rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Отзыв оставлен!', description: `Спасибо за оценку ${revieweeName}` });
        setRating(0);
        setComment('');
        onReviewSubmitted();
        onOpenChange(false);
      } else if (res.status === 409) {
        toast({ title: 'Отзыв уже оставлен', description: 'Вы уже оценили этого участника' });
        onOpenChange(false);
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось сохранить отзыв', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Произошла ошибка', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const label = role === 'client'
    ? `Оцените исполнителя — ${revieweeName}`
    : `Оцените заказчика — ${revieweeName}`;

  const stars = [1, 2, 3, 4, 5];
  const display = hovered || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Оставить отзыв</DialogTitle>
          <p className="text-sm text-muted-foreground">{orderTitle}</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="font-medium">{label}</p>

          <div className="flex gap-2">
            {stars.map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-110"
              >
                <Icon
                  name="Star"
                  size={36}
                  className={s <= display ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="self-center text-sm text-muted-foreground ml-2">
                {['', 'Плохо', 'Ниже среднего', 'Нормально', 'Хорошо', 'Отлично'][rating]}
              </span>
            )}
          </div>

          <Textarea
            placeholder="Напишите отзыв (необязательно)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Пропустить
            </Button>
            <Button
              className="gradient-primary text-white border-0"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? <Icon name="Loader2" size={16} className="mr-1 animate-spin" /> : null}
              Отправить отзыв
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
