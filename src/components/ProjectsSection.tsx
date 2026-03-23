import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import type { SortOrder } from '@/components/HeroSection';
import type { UserRole } from '@/hooks/useIndexState';
import type { ProjectsSectionProps, Order } from './projects/projectsSectionTypes';
import { CATEGORY_SIBLINGS } from './projects/projectsSectionTypes';
import ActiveOrdersTab from './projects/ActiveOrdersTab';
import AllOrdersTab from './projects/AllOrdersTab';
import FreelancerCard from './projects/FreelancerCard';

export type { SortOrder, UserRole };

const ProjectsSection = ({
  orders,
  myOrders = [],
  respondedOrders = [],
  freelancers,
  topFreelancers,
  user,
  searchQuery = '',
  selectedCategory = 'all',
  sortOrder = 'newest',
  onDeleteOrder,
  onFreelancerClick,
  onCreateOrder,
  onViewUserProfile,
  onStartChat,
  onRespondToOrder,
  onViewResponses,
  onCompleteOrder,
  onViewFreelancerProfile,
  onStartDirectChat,
  userRole = 'client',
}: ProjectsSectionProps) => {
  const isFreelancer = userRole === 'freelancer';
  const [activeTab, setActiveTab] = useState('projects');
  const q = searchQuery.toLowerCase().trim();

  const matchesSearch = (order: Order) => {
    if (!q) return true;
    return (
      order.title.toLowerCase().includes(q) ||
      order.description.toLowerCase().includes(q) ||
      order.category.toLowerCase().includes(q)
    );
  };

  const matchesCategory = (order: Order) =>
    selectedCategory === 'all' || order.category === selectedCategory;

  const sortFn = (a: Order, b: Order): number => {
    if (sortOrder === 'newest') return (b.id ?? 0) - (a.id ?? 0);
    if (sortOrder === 'oldest') return (a.id ?? 0) - (b.id ?? 0);
    if (sortOrder === 'budget_desc') return ((b.budget_max ?? 0) - (a.budget_max ?? 0));
    if (sortOrder === 'budget_asc') return ((a.budget_min ?? 0) - (b.budget_min ?? 0));
    if (sortOrder === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return 0;
  };

  const sourceOrders = isFreelancer ? respondedOrders : (user ? myOrders : orders);
  const exactMatches = sourceOrders.filter((o) => matchesSearch(o) && matchesCategory(o)).sort(sortFn);
  const hasQuery = q.length > 0 || selectedCategory !== 'all';
  const noExactResults = hasQuery && exactMatches.length === 0;

  const similarOrders = noExactResults
    ? sourceOrders.filter((o) => {
        if (selectedCategory !== 'all') {
          const siblings = CATEGORY_SIBLINGS[selectedCategory] || [];
          return siblings.includes(o.category);
        }
        return true;
      }).sort(sortFn).slice(0, 6)
    : [];

  const displayOrders = noExactResults ? similarOrders : exactMatches;

  return (
    <section id="projects" className="py-12">
      <div className="container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full max-w-2xl mx-auto mb-8 ${isFreelancer ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="projects">Активные заказы</TabsTrigger>
            {isFreelancer ? (
              <TabsTrigger value="all-orders">Все заказы</TabsTrigger>
            ) : (
              <>
                <TabsTrigger value="top">Топ фрилансеров</TabsTrigger>
                <TabsTrigger value="freelancers">Все фрилансеры</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <ActiveOrdersTab
              displayOrders={displayOrders}
              noExactResults={noExactResults}
              similarOrders={similarOrders}
              isFreelancer={isFreelancer}
              user={user}
              onCreateOrder={onCreateOrder}
              onSetActiveTab={setActiveTab}
              onViewUserProfile={onViewUserProfile}
              onStartChat={onStartChat}
              onRespondToOrder={onRespondToOrder}
              onViewResponses={onViewResponses}
              onCompleteOrder={onCompleteOrder}
              onDeleteOrder={onDeleteOrder}
            />
          </TabsContent>

          <TabsContent value="all-orders" className="space-y-4">
            <AllOrdersTab
              orders={orders}
              respondedOrders={respondedOrders}
              user={user}
              onViewUserProfile={onViewUserProfile}
              onStartChat={onStartChat}
              onRespondToOrder={onRespondToOrder}
            />
          </TabsContent>

          <TabsContent value="top" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topFreelancers.map((freelancer) => (
                <FreelancerCard
                  key={freelancer.id}
                  freelancer={freelancer}
                  user={user}
                  variant="top"
                  onViewFreelancerProfile={onViewFreelancerProfile}
                  onStartDirectChat={onStartDirectChat}
                />
              ))}
            </div>
            {topFreelancers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Пока нет зарегистрированных фрилансеров</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="freelancers" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((freelancer) => (
                <FreelancerCard
                  key={freelancer.id}
                  freelancer={freelancer}
                  user={user}
                  variant="all"
                  onViewFreelancerProfile={onViewFreelancerProfile}
                  onStartDirectChat={onStartDirectChat}
                />
              ))}
              {freelancers.length === 0 && (
                <div className="col-span-3 text-center py-12 text-muted-foreground">
                  <p className="text-lg">Пока нет фрилансеров с отзывами</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProjectsSection;
