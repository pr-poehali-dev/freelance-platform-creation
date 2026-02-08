import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';
import Dialogs from '@/components/Dialogs';
import ChatDialog from '@/components/ChatDialog';
import ChatListDialog from '@/components/ChatListDialog';
import UserProfileDialog from '@/components/UserProfileDialog';
import ResponseDialog from '@/components/ResponseDialog';
import OrderResponsesDialog from '@/components/OrderResponsesDialog';
import FreelancerProfileDialog from '@/components/FreelancerProfileDialog';
import WalletDialog from '@/components/WalletDialog';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  balance?: number;
}

interface Freelancer {
  id: number;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  reviews: number;
  completedProjects: number;
  hourlyRate: string;
  skills: string[];
  portfolio: Array<{ id: number; title: string; image: string }>;
  bio: string;
}

interface Order {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  user_id: number;
  user_name: string;
}

interface TopFreelancer {
  id: number;
  user_id: number;
  name: string;
  username: string;
  bio: string;
  hourly_rate: number;
  avatar_url: string;
  skills: string[];
  rating: number;
  total_reviews: number;
  completed_projects: number;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showChatListDialog, setShowChatListDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showUserProfileDialog, setShowUserProfileDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showOrderResponsesDialog, setShowOrderResponsesDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderTitle, setSelectedOrderTitle] = useState('');
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<{ id: number; name: string } | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<TopFreelancer[]>([]);
  const [showFreelancerProfileDialog, setShowFreelancerProfileDialog] = useState(false);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<number | null>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.id) {
        loadBalance(userData.id);
      }
    }
  }, []);

  const loadBalance = async (userId: number) => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/d070886d-956d-4b8a-801d-eaf576bf9ccf?action=balance',
        {
          headers: {
            'X-User-Id': userId.toString(),
          },
        }
      );
      const data = await response.json();
      if (data.balance !== undefined) {
        setUser((prev) => prev ? { ...prev, balance: data.balance } : null);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.balance = data.balance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setShowAuthDialog(false);
    if (userData.id) {
      loadBalance(userData.id);
    }
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setUser((prev) => prev ? { ...prev, balance: newBalance } : null);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userData.balance = newBalance;
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/2862d449-505a-4b67-970b-db34c9334ed0');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadTopFreelancers();
  }, []);

  const loadTopFreelancers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/0db794de-963c-4ac1-9537-4f9a94d9ec66?action=list&limit=20');
      const data = await response.json();
      setTopFreelancers(data.freelancers || []);
    } catch (error) {
      console.error('Ошибка загрузки фрилансеров:', error);
    }
  };

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

  const handleViewUserProfile = async (userId: number) => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/2862d449-505a-4b67-970b-db34c9334ed0?user_id=${userId}`
      );
      const data = await response.json();
      const userOrders = data.orders || [];

      const userResponse = await fetch(
        `https://functions.poehali.dev/dc6e212b-76c3-4b8c-8484-ab127b176d7e?action=get_user&user_id=${userId}`
      );
      const userData = await userResponse.json();

      setSelectedUserId(userId);
      setSelectedUserData(userData.user || null);
      setSelectedUserOrders(userOrders);
      setShowUserProfileDialog(true);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };

  const handleStartChat = (userId: number, orderId: number) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setActiveChatId(null);
      setActiveChatUser({ id: userId, name: order.user_name });
      setActiveChatOrderId(orderId);
      setShowChatDialog(true);
      setShowUserProfileDialog(false);
    }
  };

  const handleOpenChatFromList = (chatId: number, otherUserId: number, otherUserName: string) => {
    setActiveChatId(chatId);
    setActiveChatUser({ id: otherUserId, name: otherUserName });
    setActiveChatOrderId(null);
    setShowChatDialog(true);
    setShowChatListDialog(false);
  };

  const handleRespondToOrder = (orderId: number, orderTitle: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setSelectedOrderId(orderId);
    setSelectedOrderTitle(orderTitle);
    setShowResponseDialog(true);
  };

  const handleViewResponses = (orderId: number, orderTitle: string) => {
    setSelectedOrderId(orderId);
    setSelectedOrderTitle(orderTitle);
    setShowOrderResponsesDialog(true);
  };

  const handleResponseSuccess = () => {
    loadOrders();
  };

  const handleViewFreelancerProfile = (freelancerId: number) => {
    setSelectedFreelancerId(freelancerId);
    setShowFreelancerProfileDialog(true);
  };

  const handleStartChatWithFreelancer = (userId: number) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    const freelancer = topFreelancers.find(f => f.user_id === userId);
    if (freelancer) {
      setActiveChatId(null);
      setActiveChatUser({ id: userId, name: freelancer.name });
      setActiveChatOrderId(null);
      setShowChatDialog(true);
      setShowFreelancerProfileDialog(false);
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
        onShowChats={() => setShowChatListDialog(true)}
        onShowWallet={() => setShowWalletDialog(true)}
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
        topFreelancers={topFreelancers}
        user={user}
        onDeleteOrder={handleDeleteOrder}
        onFreelancerClick={setSelectedFreelancer}
        onCreateOrder={handleCreateOrder}
        onViewUserProfile={handleViewUserProfile}
        onStartChat={handleStartChat}
        onRespondToOrder={handleRespondToOrder}
        onViewResponses={handleViewResponses}
        onViewFreelancerProfile={handleViewFreelancerProfile}
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
        onShowWallet={() => setShowWalletDialog(true)}
      />

      {user && (
        <>
          <ChatListDialog
            open={showChatListDialog}
            onOpenChange={setShowChatListDialog}
            userId={user.id}
            onOpenChat={handleOpenChatFromList}
          />

          <ChatDialog
            open={showChatDialog}
            onOpenChange={setShowChatDialog}
            chatId={activeChatId}
            otherUser={activeChatUser}
            currentUserId={user.id}
            orderId={activeChatOrderId || undefined}
          />
        </>
      )}

      <UserProfileDialog
        open={showUserProfileDialog}
        onOpenChange={setShowUserProfileDialog}
        user={selectedUserData}
        currentUser={user}
        userOrders={selectedUserOrders}
        onStartChat={handleStartChat}
      />

      {user && selectedOrderId && (
        <>
          <ResponseDialog
            open={showResponseDialog}
            onOpenChange={setShowResponseDialog}
            orderId={selectedOrderId}
            orderTitle={selectedOrderTitle}
            userId={user.id}
            onSuccess={handleResponseSuccess}
          />

          <OrderResponsesDialog
            open={showOrderResponsesDialog}
            onOpenChange={setShowOrderResponsesDialog}
            orderId={selectedOrderId}
            orderTitle={selectedOrderTitle}
            userId={user.id}
            onResponseAccepted={handleResponseSuccess}
          />
        </>
      )}

      <FreelancerProfileDialog
        open={showFreelancerProfileDialog}
        onOpenChange={setShowFreelancerProfileDialog}
        freelancerId={selectedFreelancerId}
        currentUserId={user?.id || null}
        onStartChat={handleStartChatWithFreelancer}
      />

      {user && (
        <WalletDialog
          open={showWalletDialog}
          onOpenChange={setShowWalletDialog}
          userId={user.id}
          initialBalance={user.balance || 0}
          onBalanceUpdate={handleBalanceUpdate}
        />
      )}

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