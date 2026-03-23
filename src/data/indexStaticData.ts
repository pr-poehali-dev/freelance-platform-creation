export const categories = [
  { id: 'all', name: 'Все', icon: 'Grid3x3' },
  { id: 'design', name: 'Дизайн', icon: 'Palette' },
  { id: 'development', name: 'Разработка', icon: 'Code' },
  { id: 'marketing', name: 'Маркетинг', icon: 'TrendingUp' },
  { id: 'writing', name: 'Тексты', icon: 'FileText' },
  { id: 'video', name: 'Видео', icon: 'Video' },
];

export const projects = [
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

export const freelancers: never[] = [];