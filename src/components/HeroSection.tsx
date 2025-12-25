import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: Array<{ id: string; name: string; icon: string }>;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const HeroSection = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: HeroSectionProps) => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">
            Найдите идеального <span className="text-gradient">фрилансера</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Тысячи профессионалов готовы воплотить ваш проект в реальность
          </p>
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                placeholder="Поиск по заказам или специалистам..."
                className="pl-10 h-12 text-base"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <Button size="lg" className="gradient-primary text-white border-0 px-8">
              Найти
            </Button>
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap mb-12">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className={selectedCategory === cat.id ? 'gradient-primary text-white border-0' : ''}
              onClick={() => onCategoryChange(cat.id)}
            >
              <Icon name={cat.icon as any} size={16} className="mr-2" />
              {cat.name}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
