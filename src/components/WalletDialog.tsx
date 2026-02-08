import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  order_id: number | null;
  created_at: string;
  related_user_name: string | null;
}

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  initialBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

const WalletDialog = ({
  open,
  onOpenChange,
  userId,
  initialBalance,
  onBalanceUpdate,
}: WalletDialogProps) => {
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTransactions();
      setBalance(initialBalance);
    }
  }, [open, initialBalance]);

  const loadTransactions = async () => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/d070886d-956d-4b8a-801d-eaf576bf9ccf?action=transactions&limit=20',
        {
          headers: {
            'X-User-Id': userId.toString(),
          },
        }
      );
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/d070886d-956d-4b8a-801d-eaf576bf9ccf',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId.toString(),
          },
          body: JSON.stringify({
            action: 'deposit',
            amount: amount,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        onBalanceUpdate(data.balance);
        setDepositAmount('');
        loadTransactions();
        toast({
          title: 'Успешно',
          description: `Счет пополнен на ${amount.toLocaleString()} ₽`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось пополнить счет',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при пополнении',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Icon name="ArrowDownToLine" size={20} className="text-green-600" />;
      case 'payment':
        return <Icon name="ArrowUpFromLine" size={20} className="text-red-600" />;
      case 'income':
        return <Icon name="ArrowDownToLine" size={20} className="text-green-600" />;
      default:
        return <Icon name="DollarSign" size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'income':
        return 'text-green-600';
      case 'payment':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Мой счет</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="gradient-card border-2">
            <CardHeader>
              <CardTitle className="text-lg">Баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gradient mb-4">
                {balance.toLocaleString()} ₽
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Сумма пополнения"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="gradient-primary text-white border-0"
                >
                  <Icon name="Plus" size={18} className="mr-2" />
                  Пополнить
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold mb-4">История операций</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Receipt" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Пока нет транзакций</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.related_user_name && (
                              <p className="text-sm text-muted-foreground">
                                {transaction.related_user_name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount.toLocaleString()} ₽
                          </p>
                          {transaction.type === 'deposit' && (
                            <Badge variant="secondary" className="text-xs">
                              Пополнение
                            </Badge>
                          )}
                          {transaction.type === 'payment' && (
                            <Badge variant="secondary" className="text-xs">
                              Оплата
                            </Badge>
                          )}
                          {transaction.type === 'income' && (
                            <Badge variant="secondary" className="text-xs">
                              Доход
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletDialog;
