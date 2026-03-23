import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SortOrder } from '@/components/HeroSection';

export type UserRole = 'client' | 'freelancer';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  balance?: number;
  role?: UserRole;
}

export interface Order {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  user_id: number;
  user_name: string;
  status?: 'active' | 'in_progress' | 'completed';
  executor_id?: number;
  executor_name?: string;
  response_status?: 'pending' | 'accepted' | 'rejected';
}

export interface TopFreelancer {
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

export const useIndexState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState<User | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showChatListDialog, setShowChatListDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showUserProfileDialog, setShowUserProfileDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showOrderResponsesDialog, setShowOrderResponsesDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState<{
    completedOrderId: number;
    orderTitle: string;
    revieweeName: string;
    role: 'client' | 'freelancer';
  } | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderTitle, setSelectedOrderTitle] = useState('');
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<{ id: number; name: string } | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [respondedOrders, setRespondedOrders] = useState<Order[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<TopFreelancer[]>([]);
  const [allFreelancers, setAllFreelancers] = useState<TopFreelancer[]>([]);
  const [showFreelancerProfileDialog, setShowFreelancerProfileDialog] = useState(false);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<number | null>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showDirectChatDialog, setShowDirectChatDialog] = useState(false);
  const [directChatUser, setDirectChatUser] = useState<{ id: number; name: string } | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('all');
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('userRole') as UserRole) || 'client';
  });
  const { toast } = useToast();
  const shownReviewIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.id) {
        loadBalance(userData.id);
        loadRespondedOrders(userData.id);
        loadMyOrders(userData.id);
      }
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadTopFreelancers();
    loadAllFreelancers();
  }, []);

  const checkPendingReview = async (userId: number) => {
    try {
      const res = await fetch(
        'https://functions.poehali.dev/44b24f74-a364-4f56-9258-45c0c88b94e5?action=pending',
        { headers: { 'X-User-Id': userId.toString() } }
      );
      const data = await res.json();
      if (data.pending && !shownReviewIds.current.has(data.pending.completed_order_id)) {
        shownReviewIds.current.add(data.pending.completed_order_id);
        setReviewData({
          completedOrderId: data.pending.completed_order_id,
          orderTitle: data.pending.order_title,
          revieweeName: data.pending.reviewee_name,
          role: data.pending.role,
        });
        setShowReviewDialog(true);
      }
    } catch { /* тихо */ }
  };

  useEffect(() => {
    if (!user?.id) return;
    checkPendingReview(user.id);
    const interval = setInterval(() => checkPendingReview(user.id), 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadBalance = async (userId: number) => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/d070886d-956d-4b8a-801d-eaf576bf9ccf?action=balance',
        { headers: { 'X-User-Id': userId.toString() } }
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

  const loadOrders = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/2862d449-505a-4b67-970b-db34c9334ed0');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  const loadMyOrders = async (userId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/2862d449-505a-4b67-970b-db34c9334ed0?user_id=${userId}&status=`);
      const data = await response.json();
      setMyOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки своих заказов:', error);
    }
  };

  const loadRespondedOrders = async (userId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/2862d449-505a-4b67-970b-db34c9334ed0?freelancer_id=${userId}`);
      const data = await response.json();
      setRespondedOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки откликнутых заказов:', error);
    }
  };

  const loadTopFreelancers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/0db794de-963c-4ac1-9537-4f9a94d9ec66?action=list&limit=4');
      const data = await response.json();
      setTopFreelancers(data.freelancers || []);
    } catch (error) {
      console.error('Ошибка загрузки фрилансеров:', error);
    }
  };

  const loadAllFreelancers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/0db794de-963c-4ac1-9537-4f9a94d9ec66?action=list&limit=100');
      const data = await response.json();
      setAllFreelancers(data.freelancers || []);
    } catch (error) {
      console.error('Ошибка загрузки всех фрилансеров:', error);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAuthSuccess = (userData: User, role: UserRole) => {
    setUser(userData);
    setShowAuthDialog(false);
    handleRoleChange(role);
    if (userData.id) {
      loadBalance(userData.id);
      loadRespondedOrders(userData.id);
      loadMyOrders(userData.id);
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

  const handleCreateOrder = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setShowCreateOrderDialog(true);
  };

  const handleOrderCreated = () => {
    loadOrders();
    if (user?.id) loadMyOrders(user.id);
  };

  const handleCompleteOrder = async (orderId: number) => {
    if (!user) return;
    if (!confirm('Подтвердить выполнение заказа? Заказ будет сохранён в историю и удалён из активных.')) return;
    try {
      const response = await fetch('https://functions.poehali.dev/398a8b33-64ba-4a3b-be92-18cc1971a490', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id.toString() },
        body: JSON.stringify({ action: 'complete_order', order_id: orderId }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Заказ выполнен!', description: 'Заказ сохранён в историю выполненных' });
        loadOrders();
        if (user?.id) loadMyOrders(user.id);
        if (data.completed_order_id && data.executor_name) {
          setReviewData({
            completedOrderId: data.completed_order_id,
            orderTitle: data.order_title,
            revieweeName: data.executor_name,
            role: 'client',
          });
          setShowReviewDialog(true);
        }
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось завершить заказ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Произошла ошибка', variant: 'destructive' });
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!user) return;
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    try {
      const response = await fetch(
        `https://functions.poehali.dev/1db66e23-3d86-46cc-9d5a-b7e61f16daa9?order_id=${orderId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id.toString() },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Заказ удален', description: 'Ваш заказ успешно удален' });
        loadOrders();
        if (user?.id) loadMyOrders(user.id);
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось удалить заказ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Произошла ошибка при удалении заказа', variant: 'destructive' });
    }
  };

  const handleViewUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/2862d449-505a-4b67-970b-db34c9334ed0?user_id=${userId}`);
      const data = await response.json();
      const userOrders = data.orders || [];

      const userResponse = await fetch(`https://functions.poehali.dev/dc6e212b-76c3-4b8c-8484-ab127b176d7e?action=get_user&user_id=${userId}`);
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
    const order =
      orders.find(o => o.id === orderId) ||
      myOrders.find(o => o.id === orderId) ||
      respondedOrders.find(o => o.id === orderId);

    const otherUserName = order
      ? (userId === order.user_id ? order.user_name : (order.executor_name || 'Пользователь'))
      : 'Пользователь';

    setActiveChatId(null);
    setActiveChatUser({ id: userId, name: otherUserName });
    setActiveChatOrderId(orderId);
    setShowChatDialog(true);
    setShowUserProfileDialog(false);
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
    if (user?.id) {
      loadRespondedOrders(user.id);
      loadMyOrders(user.id);
    }
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
    const name = freelancer?.name || 'Фрилансер';
    setDirectChatUser({ id: userId, name });
    setShowDirectChatDialog(true);
    setShowFreelancerProfileDialog(false);
  };

  const handleStartDirectChat = (userId: number, userName: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setDirectChatUser({ id: userId, name: userName });
    setShowDirectChatDialog(true);
  };

  return {
    // state
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    user,
    showAuthDialog, setShowAuthDialog,
    showCreateOrderDialog, setShowCreateOrderDialog,
    showProfileDialog, setShowProfileDialog,
    showChatListDialog, setShowChatListDialog,
    showChatDialog, setShowChatDialog,
    showUserProfileDialog, setShowUserProfileDialog,
    showResponseDialog, setShowResponseDialog,
    showOrderResponsesDialog, setShowOrderResponsesDialog,
    showReviewDialog, setShowReviewDialog,
    reviewData,
    selectedOrderId,
    selectedOrderTitle,
    activeChatId,
    activeChatUser,
    activeChatOrderId,
    selectedUserId,
    selectedUserData,
    selectedUserOrders,
    orders,
    myOrders,
    respondedOrders,
    topFreelancers,
    allFreelancers,
    showFreelancerProfileDialog, setShowFreelancerProfileDialog,
    selectedFreelancerId,
    showWalletDialog, setShowWalletDialog,
    showDirectChatDialog, setShowDirectChatDialog,
    directChatUser,
    sortOrder, setSortOrder,
    appliedSearch, setAppliedSearch,
    appliedCategory, setAppliedCategory,
    userRole, handleRoleChange,
    // handlers
    handleLogout,
    handleAuthSuccess,
    handleBalanceUpdate,
    handleCreateOrder,
    handleOrderCreated,
    handleDeleteOrder,
    handleCompleteOrder,
    handleViewUserProfile,
    handleStartChat,
    handleOpenChatFromList,
    handleRespondToOrder,
    handleViewResponses,
    handleResponseSuccess,
    handleViewFreelancerProfile,
    handleStartChatWithFreelancer,
    handleStartDirectChat,
  };
};