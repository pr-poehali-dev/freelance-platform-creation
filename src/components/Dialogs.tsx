import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import LoginAuth from '@/components/LoginAuth';
import CreateOrderDialog from '@/components/CreateOrderDialog';
import ProfileDialog from '@/components/ProfileDialog';

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

interface DialogsProps {
  selectedFreelancer: Freelancer | null;
  onCloseFreelancer: () => void;
  showAuthDialog: boolean;
  onCloseAuth: (open: boolean) => void;
  onAuthSuccess: (userData: User) => void;
  showCreateOrderDialog: boolean;
  onCloseCreateOrder: (open: boolean) => void;
  user: User | null;
  onOrderCreated: () => void;
  showProfileDialog: boolean;
  onCloseProfile: (open: boolean) => void;
  onLogout: () => void;
  onShowWallet: () => void;
}

const Dialogs = ({
  selectedFreelancer,
  onCloseFreelancer,
  showAuthDialog,
  onCloseAuth,
  onAuthSuccess,
  showCreateOrderDialog,
  onCloseCreateOrder,
  user,
  onOrderCreated,
  showProfileDialog,
  onCloseProfile,
  onLogout,
  onShowWallet,
}: DialogsProps) => {
  return (
    <>
      <Dialog open={!!selectedFreelancer} onOpenChange={onCloseFreelancer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedFreelancer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Портфолио фрилансера</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={selectedFreelancer.avatar} />
                    <AvatarFallback className="gradient-primary text-white text-3xl font-bold">
                      {selectedFreelancer.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{selectedFreelancer.name}</h3>
                    <p className="text-lg text-muted-foreground mb-3">{selectedFreelancer.role}</p>
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="Star" size={20} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{selectedFreelancer.rating}</span>
                        <span className="text-muted-foreground">({selectedFreelancer.reviews} отзывов)</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon name="Briefcase" size={20} />
                        <span>{selectedFreelancer.completedProjects} выполненных проектов</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{selectedFreelancer.bio}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gradient">{selectedFreelancer.hourlyRate}</span>
                      <Button className="gradient-primary text-white border-0">
                        <Icon name="MessageCircle" size={18} className="mr-2" />
                        Написать
                      </Button>
                      <Button className="gradient-primary text-white border-0">
                        <Icon name="Briefcase" size={18} className="mr-2" />
                        Нанять
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Навыки</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFreelancer.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-sm px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Портфолио и кейсы</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedFreelancer.portfolio.map((item) => (
                      <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all">
                        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAuthDialog} onOpenChange={onCloseAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center mb-4">Вход на FreelanceHub</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-center text-muted-foreground mb-4">
              Войдите или зарегистрируйтесь на бирже фриланса
            </p>
            <LoginAuth onSuccess={onAuthSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {user && (
        <CreateOrderDialog
          open={showCreateOrderDialog}
          onOpenChange={onCloseCreateOrder}
          userId={user.id}
          onSuccess={onOrderCreated}
        />
      )}

      <ProfileDialog
        open={showProfileDialog}
        onOpenChange={onCloseProfile}
        user={user}
        onLogout={onLogout}
        onShowWallet={onShowWallet}
      />
    </>
  );
};

export default Dialogs;