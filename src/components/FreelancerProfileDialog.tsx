import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useEffect, useState } from 'react';

interface FreelancerProfile {
  id: number;
  user_id: number;
  name: string;
  username: string;
  email: string;
  bio: string;
  hourly_rate: number;
  avatar_url: string;
  skills: string[];
  rating: number;
  total_reviews: number;
  completed_projects: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  client_name: string;
  order_title: string;
}

interface CompletedOrder {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
}

interface FreelancerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freelancerId: number | null;
  currentUserId: number | null;
  onStartChat?: (userId: number) => void;
}

const FreelancerProfileDialog = ({
  open,
  onOpenChange,
  freelancerId,
  currentUserId,
  onStartChat,
}: FreelancerProfileDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  useEffect(() => {
    if (open && freelancerId) {
      loadFreelancerProfile();
    }
  }, [open, freelancerId]);

  const loadFreelancerProfile = async () => {
    if (!freelancerId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/0db794de-963c-4ac1-9537-4f9a94d9ec66?action=profile&freelancer_id=${freelancerId}`
      );
      const data = await response.json();
      
      setFreelancer(data.freelancer || null);
      setReviews(data.reviews || []);
      setCompletedOrders(data.completed_orders || []);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !freelancer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Загрузка профиля...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="Star"
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Профиль фрилансера</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={freelancer.avatar_url} />
              <AvatarFallback className="gradient-primary text-white text-3xl font-bold">
                {freelancer.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">{freelancer.name}</h3>
              <p className="text-muted-foreground mb-3">@{freelancer.username}</p>
              
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="Star" size={20} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">{freelancer.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({freelancer.total_reviews} отзывов)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="Briefcase" size={20} />
                  <span>{freelancer.completed_projects} выполненных проектов</span>
                </div>
              </div>

              {freelancer.bio && (
                <p className="text-muted-foreground mb-4">{freelancer.bio}</p>
              )}

              <div className="flex items-center gap-3">
                {freelancer.hourly_rate && (
                  <span className="text-2xl font-bold text-gradient">
                    {freelancer.hourly_rate.toLocaleString()} ₽/час
                  </span>
                )}
                {currentUserId && currentUserId !== freelancer.user_id && onStartChat && (
                  <Button
                    className="gradient-primary text-white border-0"
                    onClick={() => onStartChat(freelancer.user_id)}
                  >
                    <Icon name="MessageCircle" size={18} className="mr-2" />
                    Написать
                  </Button>
                )}
              </div>
            </div>
          </div>

          {freelancer.skills && freelancer.skills.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Навыки</h4>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {completedOrders.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Выполненные заказы</h4>
              <div className="grid gap-3">
                {completedOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">{order.title}</CardTitle>
                          <CardDescription className="text-sm">{order.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{order.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {order.budget_min && order.budget_max && (
                            <>
                              {order.budget_min.toLocaleString()} - {order.budget_max.toLocaleString()} ₽
                            </>
                          )}
                        </span>
                        <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Отзывы</h4>
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base mb-1">{review.client_name}</CardTitle>
                          <CardDescription className="text-sm">
                            Заказ: {review.order_title}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </CardHeader>
                    {review.comment && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {reviews.length === 0 && completedOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Пока нет выполненных заказов и отзывов</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreelancerProfileDialog;
