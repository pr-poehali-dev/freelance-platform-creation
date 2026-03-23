import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';

export type SortOrder = 'newest' | 'oldest' | 'budget_asc' | 'budget_desc' | 'deadline';

const SORT_LABELS: Record<SortOrder, string> = {
  newest:      'Сначала новые',
  oldest:      'Сначала старые',
  budget_desc: 'Бюджет: по убыванию',
  budget_asc:  'Бюджет: по возрастанию',
  deadline:    'По дедлайну',
};

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  categories: Array<{ id: string; name: string; icon: string }>;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  sortOrder: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  userRole?: 'client' | 'freelancer';
}

const HeroSection = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  categories,
  selectedCategory,
  onCategoryChange,
  sortOrder,
  onSortChange,
  userRole = 'client',
}: HeroSectionProps) => {
  const isFreelancer = userRole === 'freelancer';
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(inputValue);
    onSearchSubmit();
  };

  const handleCategoryChange = (catId: string) => {
    onCategoryChange(catId);
    onSearchSubmit();
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">
            {isFreelancer ? (
              <>Ты справишься <span className="text-gradient">со всем!</span></>
            ) : (
              <>Найдите идеального <span className="text-gradient">фрилансера</span></>
            )}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {isFreelancer
              ? 'Даже лучшие мастера начинали с малого..'
              : 'Тысячи профессионалов готовы воплотить ваш проект в реальность'}
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                placeholder="Поиск по заказам..."
                className="pl-10 h-12 text-base"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            {/* Кнопка сортировки */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="lg" className="h-12 px-4 gap-2">
                  <Icon name="ArrowUpDown" size={16} />
                  <span className="hidden sm:inline">Сортировка</span>
                  <Icon name="ChevronDown" size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={(v) => onSortChange(v as SortOrder)}>
                  {(Object.keys(SORT_LABELS) as SortOrder[]).map((key) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {SORT_LABELS[key]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button type="submit" size="lg" className="gradient-primary text-white border-0 px-8 h-12">
              Найти
            </Button>
          </form>
        </div>

        <div className="flex gap-3 justify-center flex-wrap mb-12">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className={selectedCategory === cat.id ? 'gradient-primary text-white border-0' : ''}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <Icon name={cat.icon} size={16} className="mr-2" />
              {cat.name}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;