import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { TopFreelancer, User } from './projectsSectionTypes';

interface FreelancerCardProps {
  freelancer: TopFreelancer;
  user: User | null;
  variant: 'top' | 'all';
  onViewFreelancerProfile: (freelancerId: number) => void;
  onStartDirectChat: (userId: number, userName: string) => void;
}

const FreelancerCard = ({
  freelancer,
  user,
  variant,
  onViewFreelancerProfile,
  onStartDirectChat,
}: FreelancerCardProps) => {
  return (
    <Card
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer gradient-card border-2 hover:border-primary/20"
      onClick={() => onViewFreelancerProfile(freelancer.id)}
    >
      <CardHeader>
        <div className="flex items-center gap-4 mb-3">
          <Avatar className="w-16 h-16 border-4 border-primary/20">
            <AvatarImage src={freelancer.avatar_url} />
            <AvatarFallback className="gradient-primary text-white text-xl font-bold">
              {freelancer.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg mb-1">{freelancer.name}</CardTitle>
            <p className="text-sm text-muted-foreground">@{freelancer.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1">
            <Icon name="Star" size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{Number(freelancer.rating).toFixed(1)}</span>
            <span className="text-muted-foreground">({freelancer.total_reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Icon name="Briefcase" size={16} />
            <span>{freelancer.completed_projects}{variant === 'all' ? ' проектов' : ''}</span>
          </div>
        </div>
        {variant === 'top' && freelancer.bio && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{freelancer.bio}</p>
        )}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {freelancer.skills.slice(0, 3).map((skill: string) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {freelancer.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{freelancer.skills.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gradient">
            {freelancer.hourly_rate
              ? variant === 'top'
                ? `${freelancer.hourly_rate.toLocaleString()} ₽/час`
                : `от ${freelancer.hourly_rate.toLocaleString()} ₽/ч`
              : variant === 'top' ? 'Договорная' : ''}
          </span>
          <div className="flex gap-2">
            {variant === 'top' && user && user.id !== freelancer.user_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartDirectChat(freelancer.user_id, freelancer.name);
                }}
              >
                <Icon name="MessageCircle" size={14} className="mr-1" />
                Написать
              </Button>
            )}
            {variant === 'top' ? (
              <Button
                size="sm"
                className="gradient-primary text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFreelancerProfile(freelancer.id);
                }}
              >
                Профиль
              </Button>
            ) : (
              <Button
                size="sm"
                className="gradient-primary text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartDirectChat(freelancer.user_id, freelancer.name);
                }}
              >
                Написать
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreelancerCard;
