import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ProjectsSectionProps {
  orders: any[];
  freelancers: any[];
  user: any;
  onDeleteOrder: (orderId: number) => void;
  onFreelancerClick: (freelancer: any) => void;
  onCreateOrder: () => void;
}

const ProjectsSection = ({
  orders,
  freelancers,
  user,
  onDeleteOrder,
  onFreelancerClick,
  onCreateOrder,
}: ProjectsSectionProps) => {
  return (
    <section id="projects" className="py-12">
      <div className="container mx-auto px-4">
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="projects">Активные заказы</TabsTrigger>
            <TabsTrigger value="freelancers">Фрилансеры</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 gradient-card"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="gradient-primary text-white border-0">
                        {order.category}
                      </Badge>
                      {order.budget_min && order.budget_max && (
                        <span className="text-2xl font-bold text-gradient">
                          {order.budget_min.toLocaleString()} - {order.budget_max.toLocaleString()} ₽
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {order.title}
                    </CardTitle>
                    <CardDescription className="text-base">{order.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        {order.deadline && (
                          <span className="flex items-center gap-1">
                            <Icon name="Clock" size={16} />
                            до {new Date(order.deadline).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Icon name="User" size={16} />
                          {order.user_name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {user && user.id === order.user_id ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteOrder(order.id)}
                          >
                            <Icon name="Trash2" size={16} className="mr-1" />
                            Удалить
                          </Button>
                        ) : (
                          <Button size="sm" className="gradient-primary text-white border-0">
                            Откликнуться
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {orders.length === 0 && (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-4">Пока нет активных заказов</p>
                  <Button onClick={onCreateOrder} className="gradient-primary text-white border-0">
                    Разместить первый заказ
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="freelancers" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((freelancer) => (
                <Card
                  key={freelancer.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer gradient-card border-2 hover:border-primary/20"
                  onClick={() => onFreelancerClick(freelancer)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-3">
                      <Avatar className="w-16 h-16 border-4 border-primary/20">
                        <AvatarImage src={freelancer.avatar} />
                        <AvatarFallback className="gradient-primary text-white text-xl font-bold">
                          {freelancer.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg mb-1">{freelancer.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{freelancer.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={16} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{freelancer.rating}</span>
                        <span className="text-muted-foreground">({freelancer.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Icon name="Briefcase" size={16} />
                        <span>{freelancer.completedProjects} проектов</span>
                      </div>
                    </div>
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
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gradient">{freelancer.hourlyRate}</span>
                      <Button size="sm" className="gradient-primary text-white border-0">
                        Нанять
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProjectsSection;
