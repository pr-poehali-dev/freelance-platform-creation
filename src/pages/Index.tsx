import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);

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
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gradient">FreelanceHub</h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#projects" className="text-sm font-medium hover:text-primary transition-colors">
                Заказы
              </a>
              <a href="#freelancers" className="text-sm font-medium hover:text-primary transition-colors">
                Фрилансеры
              </a>
              <Button variant="outline" size="sm">Войти</Button>
              <Button size="sm" className="gradient-primary text-white border-0">
                Разместить заказ
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">
              Найдите идеального <span className="text-gradient">фрилансера</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Тысячи профессионалов готовы воплотить ваш проект в реальность
            </p>
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Icon name="Search" className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <Input
                  placeholder="Поиск по заказам или специалистам..."
                  className="pl-10 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="gradient-primary text-white border-0 px-8">
                Найти
              </Button>
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap mb-12">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className={selectedCategory === cat.id ? 'gradient-primary text-white border-0' : ''}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon name={cat.icon as any} size={16} className="mr-2" />
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="projects">Активные заказы</TabsTrigger>
              <TabsTrigger value="freelancers">Фрилансеры</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 gradient-card"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="gradient-primary text-white border-0">
                          {categories.find((c) => c.id === project.category)?.name}
                        </Badge>
                        <span className="text-2xl font-bold text-gradient">{project.budget}</span>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-base">{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="Clock" size={16} />
                            {project.deadline}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Users" size={16} />
                            {project.proposals} откликов
                          </span>
                        </div>
                        <Button size="sm" className="gradient-primary text-white border-0">
                          Откликнуться
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="freelancers" className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {freelancers.map((freelancer) => (
                  <Card
                    key={freelancer.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer gradient-card border-2 hover:border-primary/20"
                    onClick={() => setSelectedFreelancer(freelancer)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-3">
                        <Avatar className="w-16 h-16 border-4 border-primary/20">
                          <AvatarImage src={freelancer.avatar} />
                          <AvatarFallback className="gradient-primary text-white text-xl font-bold">
                            {freelancer.name.split(' ').map(n => n[0]).join('')}
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
                        {freelancer.skills.slice(0, 3).map((skill) => (
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

      <Dialog open={!!selectedFreelancer} onOpenChange={() => setSelectedFreelancer(null)}>
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
                    {selectedFreelancer.portfolio.map((item: any) => (
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
