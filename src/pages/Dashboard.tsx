import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { AddOvertimeDialog } from '@/components/AddOvertimeDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OvertimeRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  lunch_discount: boolean;
  net_hours: number;
  total_value: number;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalValue: 0,
    recordCount: 0,
  });

  const fetchRecords = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('overtime_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
      
      const totalHours = (data || []).reduce((sum, r) => sum + Number(r.net_hours), 0);
      const totalValue = (data || []).reduce((sum, r) => sum + Number(r.total_value), 0);
      
      setStats({
        totalHours: Math.round(totalHours * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        recordCount: (data || []).length,
      });
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Acompanhe suas horas extras
            </p>
          </div>
          <AddOvertimeDialog onSuccess={fetchRecords} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalHours.toFixed(2)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Horas extras acumuladas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {stats.totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor acumulado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recordCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de lançamentos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Lançamentos</CardTitle>
            <CardDescription>
              Seus registros de horas extras mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum registro encontrado</p>
                <p className="text-sm mt-1">Clique em "Adicionar Hora Extra" para começar</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Desconto Almoço</TableHead>
                      <TableHead>Horas Válidas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          {formatTime(record.start_time)} - {formatTime(record.end_time)}
                        </TableCell>
                        <TableCell>
                          {record.lunch_discount ? (
                            <Badge variant="secondary">Sim (1h)</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {Number(record.net_hours).toFixed(2)}h
                        </TableCell>
                        <TableCell className="text-right font-bold text-success">
                          R$ {Number(record.total_value).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
