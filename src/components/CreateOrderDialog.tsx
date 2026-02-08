import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onSuccess: () => void;
}

const categories = [
  'Веб-разработка',
  'Мобильная разработка',
  'Дизайн',
  'Копирайтинг',
  'Маркетинг',
  'SEO',
  'Видеомонтаж',
  'Фотография',
  'Переводы',
  'Консалтинг',
];

export default function CreateOrderDialog({ open, onOpenChange, userId, onSuccess }: CreateOrderDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/52b0f153-9486-4fff-a72b-90a2cc10eca9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({
          title,
          description,
          category,
          budget_min: budgetMin ? parseInt(budgetMin) : null,
          budget_max: budgetMax ? parseInt(budgetMax) : null,
          deadline: deadline || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании заказа');
      }

      setTitle('');
      setDescription('');
      setCategory('');
      setBudgetMin('');
      setBudgetMax('');
      setDeadline('');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Разместить заказ</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Название заказа *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Разработка лендинга для стартапа"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Категория *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Описание *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробно опишите задачу, требования и ожидаемый результат..."
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetMin">Бюджет от (₽)</Label>
              <Input
                id="budgetMin"
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="10000"
              />
            </div>
            <div>
              <Label htmlFor="budgetMax">Бюджет до (₽)</Label>
              <Input
                id="budgetMax"
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="50000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Дедлайн</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 gradient-primary text-white" disabled={loading}>
              {loading ? 'Размещение...' : 'Разместить заказ'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}