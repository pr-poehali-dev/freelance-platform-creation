import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';
import Dialogs from '@/components/Dialogs';
import IndexChatDialogs from '@/components/IndexChatDialogs';
import IndexOrderDialogs from '@/components/IndexOrderDialogs';
import ActiveFreelancersDialog from '@/components/ActiveFreelancersDialog';
import { useIndexState } from '@/hooks/useIndexState';
import { categories, projects, freelancers } from '@/data/indexStaticData';

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

const Index = () => {
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);
  const s = useIndexState();

  const filteredProjects = s.appliedCategory === 'all'
    ? projects
    : projects.filter(p => p.category === s.appliedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      <Header
        user={s.user}
        userRole={s.userRole}
        onRoleChange={s.handleRoleChange}
        onShowProfile={() => s.setShowProfileDialog(true)}
        onShowAuth={() => s.setShowAuthDialog(true)}
        onCreateOrder={s.handleCreateOrder}
        onShowChats={() => s.setShowChatListDialog(true)}
        onShowWallet={() => s.setShowWalletDialog(true)}
      />

      <HeroSection
        searchQuery={s.searchQuery}
        onSearchChange={s.setSearchQuery}
        onSearchSubmit={() => {
          s.setAppliedSearch(s.searchQuery);
          s.setAppliedCategory(s.selectedCategory);
        }}
        categories={categories}
        selectedCategory={s.selectedCategory}
        onCategoryChange={(cat) => {
          s.setSelectedCategory(cat);
          s.setAppliedCategory(cat);
        }}
        sortOrder={s.sortOrder}
        onSortChange={s.setSortOrder}
      />

      <ProjectsSection
        orders={s.orders}
        myOrders={s.myOrders}
        respondedOrders={s.respondedOrders}
        freelancers={freelancers}
        topFreelancers={s.topFreelancers}
        user={s.user}
        searchQuery={s.appliedSearch}
        selectedCategory={s.appliedCategory}
        sortOrder={s.sortOrder}
        onDeleteOrder={s.handleDeleteOrder}
        onFreelancerClick={setSelectedFreelancer}
        onCreateOrder={s.handleCreateOrder}
        onViewUserProfile={s.handleViewUserProfile}
        onStartChat={s.handleStartChat}
        onRespondToOrder={s.handleRespondToOrder}
        onViewResponses={s.handleViewResponses}
        onViewActiveFreelancers={s.handleViewActiveFreelancers}
        onViewFreelancerProfile={s.handleViewFreelancerProfile}
        onStartDirectChat={s.handleStartDirectChat}
        userRole={s.userRole}
      />

      <Dialogs
        selectedFreelancer={selectedFreelancer}
        onCloseFreelancer={() => setSelectedFreelancer(null)}
        showAuthDialog={s.showAuthDialog}
        onCloseAuth={s.setShowAuthDialog}
        onAuthSuccess={s.handleAuthSuccess}
        showCreateOrderDialog={s.showCreateOrderDialog}
        onCloseCreateOrder={s.setShowCreateOrderDialog}
        user={s.user}
        onOrderCreated={s.handleOrderCreated}
        showProfileDialog={s.showProfileDialog}
        onCloseProfile={s.setShowProfileDialog}
        onLogout={s.handleLogout}
        onShowWallet={() => s.setShowWalletDialog(true)}
      />

      <IndexChatDialogs
        user={s.user}
        showChatListDialog={s.showChatListDialog}
        setShowChatListDialog={s.setShowChatListDialog}
        showChatDialog={s.showChatDialog}
        setShowChatDialog={s.setShowChatDialog}
        activeChatId={s.activeChatId}
        activeChatUser={s.activeChatUser}
        activeChatOrderId={s.activeChatOrderId}
        showDirectChatDialog={s.showDirectChatDialog}
        setShowDirectChatDialog={s.setShowDirectChatDialog}
        directChatUser={s.directChatUser}
        onOpenChatFromList={s.handleOpenChatFromList}
      />

      {s.user && (
        <ActiveFreelancersDialog
          open={s.showActiveFreelancersDialog}
          onOpenChange={s.setShowActiveFreelancersDialog}
          orderId={s.selectedOrderId}
          orderTitle={s.selectedOrderTitle}
          userId={s.user.id}
          onOrderCompleted={s.handleResponseSuccess}
        />
      )}

      <IndexOrderDialogs
        user={s.user}
        showUserProfileDialog={s.showUserProfileDialog}
        setShowUserProfileDialog={s.setShowUserProfileDialog}
        selectedUserData={s.selectedUserData}
        selectedUserOrders={s.selectedUserOrders}
        showResponseDialog={s.showResponseDialog}
        setShowResponseDialog={s.setShowResponseDialog}
        showOrderResponsesDialog={s.showOrderResponsesDialog}
        setShowOrderResponsesDialog={s.setShowOrderResponsesDialog}
        selectedOrderId={s.selectedOrderId}
        selectedOrderTitle={s.selectedOrderTitle}
        showFreelancerProfileDialog={s.showFreelancerProfileDialog}
        setShowFreelancerProfileDialog={s.setShowFreelancerProfileDialog}
        selectedFreelancerId={s.selectedFreelancerId}
        showWalletDialog={s.showWalletDialog}
        setShowWalletDialog={s.setShowWalletDialog}
        onStartChat={s.handleStartChat}
        onResponseSuccess={s.handleResponseSuccess}
        onStartChatWithFreelancer={s.handleStartChatWithFreelancer}
        onBalanceUpdate={s.handleBalanceUpdate}
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