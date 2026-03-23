import type { SortOrder } from '@/components/HeroSection';
import type { UserRole } from '@/hooks/useIndexState';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
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

export interface ProjectsSectionProps {
  orders: Order[];
  myOrders?: Order[];
  respondedOrders?: Order[];
  freelancers: TopFreelancer[];
  topFreelancers: TopFreelancer[];
  user: User | null;
  searchQuery?: string;
  selectedCategory?: string;
  sortOrder?: SortOrder;
  onDeleteOrder: (orderId: number) => void;
  onFreelancerClick: (freelancer: TopFreelancer) => void;
  onCreateOrder: () => void;
  onViewUserProfile: (userId: number) => void;
  onStartChat: (userId: number, orderId: number) => void;
  onRespondToOrder: (orderId: number, orderTitle: string) => void;
  onViewResponses: (orderId: number, orderTitle: string) => void;
  onCompleteOrder: (orderId: number) => void;
  onViewFreelancerProfile: (freelancerId: number) => void;
  onStartDirectChat: (userId: number, userName: string) => void;
  userRole?: UserRole;
}

export const CATEGORY_SIBLINGS: Record<string, string[]> = {
  design:      ['marketing', 'video'],
  development: ['design'],
  marketing:   ['design', 'writing'],
  writing:     ['marketing'],
  video:       ['design', 'marketing'],
};
