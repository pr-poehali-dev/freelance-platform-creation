import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';
import Dialogs from '@/components/Dialogs';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setShowAuthDialog(false);
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/8034563d-628a-4f60-9ef4-db23d34f9ac6');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreateOrder = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setShowCreateOrderDialog(true);
  };

  const handleOrderCreated = () => {
    loadOrders();
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!user) return;

    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://functions.poehali.dev/80aa9980-d113-4b04-b84f-7820d7ddb3fd?order_id=${orderId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString(),
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Заказ удален',
          description: 'Ваш заказ успешно удален',
        });
        loadOrders();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить заказ',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при удалении заказа',
        variant: 'destructive',
      });
    }
  };

  const categories = [
    { id: 'all', name: 'Все', icon: 'Grid3x3' },
    { id: 'design', name: 'Дизайн', icon: 'Palette' },
    { id: 'development', name: 'Разработка', icon: 'Code' },
    { id: 'marketing', name: 'Маркетинг', icon: 'TrendingUp' },
    { id: 'writing', name: 'Тексты', icon: 'FileText' },
    { id: 'video', name: 'Видео', icon: 'Video' },
  ];

  const projects = [
    {
      id: 1,
      title: 'Дизайн мобильного приложения',
      description: 'Нужен современный UI/UX дизайн для iOS приложения в сфере фитнеса',
      budget: '50 000 ₽',
      category: 'design',
      tags: ['UI/UX', 'Mobile', 'Figma'],
      deadline: '14 дней',
      proposals: 12,
    },
    {
      id: 2,
      title: 'Разработка лендинга',
      description: 'Создание продающего лендинга для SaaS продукта с интеграциями',
      budget: '80 000 ₽',
      category: 'development',
      tags: ['React', 'TypeScript', 'Landing'],
      deadline: '21 день',
      proposals: 8,
    },
    {
      id: 3,
      title: 'SMM стратегия для бренда',
      description: 'Разработка контент-стратегии и ведение соцсетей (Instagram, TikTok)',
      budget: '60 000 ₽',
      category: 'marketing',
      tags: ['SMM', 'Instagram', 'Content'],
      deadline: '30 дней',
      proposals: 15,
    },
    {
      id: 4,
      title: 'Монтаж рекламных роликов',
      description: 'Требуется видеомонтажер для создания серии роликов для YouTube',
      budget: '45 000 ₽',
      category: 'video',
      tags: ['Premiere Pro', 'After Effects'],
      deadline: '10 дней',
      proposals: 6,
    },
  ];

  const freelancers = [
    {
      id: 1,
      name: 'Анна Смирнова',
      role: 'UI/UX Дизайнер',
      avatar: '',
      rating: 4.9,
      reviews: 127,
      completedProjects: 89,
      hourlyRate: '3 500 ₽/час',
      skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
      portfolio: [
        { id: 1, title: 'Редизайн банковского приложения', image: 'https://v3b.fal.media/files/b/kangaroo/zByw1pKcZV5hPFPO1JlJw_output.png' },
        { id: 2, title: 'Дизайн-система для e-commerce', image: 'https://v3b.fal.media/files/b/kangaroo/zByw1pKcZV5hPFPO1JlJw_output.png' },
        { id: 3, title: 'Мобильное приложение для фитнеса', image: 'https://v3b.fal.media/files/b/kangaroo/zByw1pKcZV5hPFPO1JlJw_output.png' },
      ],
      bio: 'Создаю интуитивные интерфейсы, которые пользователи любят. Более 5 лет опыта в дизайне мобильных и веб-приложений.',
    },
    {
      id: 2,
      name: 'Дмитрий Коваль',
      role: 'Full-stack разработчик',
      avatar: '',
      rating: 5.0,
      reviews: 94,
      completedProjects: 112,
      hourlyRate: '4 000 ₽/час',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      portfolio: [
        { id: 1, title: 'SaaS платформа для аналитики', image: 'https://v3b.fal.media/files/b/kangaroo/zByw1pKcZV5hPFPO1JlJw_output.png' },
        { id: 2, title: 'E-commerce marketplace', image: 'https://v3b.fal.media/files/b/kangaroo/zByw1pKcZV5hPFPO1JlJw_output.png' },
      ],
      bio: 'Разрабатываю масштабируемые веб-приложения с чистым кодом. Специализируюсь на React и современном JavaScript стеке.',
    },
    {
      id: 3,
      name: 'Елена Волкова',
      role: 'SMM & Content менеджер',
      avatar: '',
      rating: 4.8,
      reviews: 156,
      completedProjects: 203,
      hourlyRate: '2 500 ₽/час',
      skills: ['Instagram', 'TikTok', 'Copywriting', 'Analytics'],
      portfolio: [
        { id: 1, title: 'Рост аудитории +150% за 3 месяца', image: 'https://v3b.fal.media/files/b/kangaroo/zByw1pKcZV5hPFPO1JlJw_output.png' },
        { id: 2, title: 'Запуск бренда с нуля до 50к подписчиков', image: 'https://v3b.fal.media/files/b/kangaroo/zByw1pKcZV5hPFPO1JlJw_output.png' },
      ],
      bio: 'Помогаю брендам расти в социальных сетях. Создаю вирусный контент и выстраиваю стратегии продвижения.',
    },
  ];

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      <Header
        user={user}
        onShowProfile={() => setShowProfileDialog(true)}
        onShowAuth={() => setShowAuthDialog(true)}
        onCreateOrder={handleCreateOrder}
      />

      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <ProjectsSection
        orders={orders}
        freelancers={freelancers}
        user={user}
        onDeleteOrder={handleDeleteOrder}
        onFreelancerClick={setSelectedFreelancer}
        onCreateOrder={handleCreateOrder}
      />

      <Dialogs
        selectedFreelancer={selectedFreelancer}
        onCloseFreelancer={() => setSelectedFreelancer(null)}
        showAuthDialog={showAuthDialog}
        onCloseAuth={setShowAuthDialog}
        onAuthSuccess={handleAuthSuccess}
        showCreateOrderDialog={showCreateOrderDialog}
        onCloseCreateOrder={setShowCreateOrderDialog}
        user={user}
        onOrderCreated={handleOrderCreated}
        showProfileDialog={showProfileDialog}
        onCloseProfile={setShowProfileDialog}
        onLogout={handleLogout}
      />

      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 text-gradient">FreelanceHub</h3>
            <p className="text-slate-400">Биржа фриланса нового поколения</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
