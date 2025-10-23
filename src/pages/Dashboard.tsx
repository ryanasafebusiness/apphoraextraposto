import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { AddOvertimeDialog } from '@/components/AddOvertimeDialog';
import { OvertimeRecordActions } from '@/components/OvertimeRecordActions';
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Acompanhe suas horas extras
            </p>
          </div>
          <AddOvertimeDialog onSuccess={fetchRecords} />
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Total de Horas</CardTitle>
              <Clock className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {stats.totalHours.toFixed(2)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Horas extras acumuladas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Valor Total</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-success">
                R$ {stats.totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor acumulado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Registros</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                {stats.recordCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de lançamentos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Histórico de Lançamentos</CardTitle>
            <CardDescription className="text-xs">
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
              <div className="space-y-2">
                {records.map((record) => (
                  <Card key={record.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {formatDate(record.date)}
                          </span>
                          {record.lunch_discount && (
                            <Badge variant="secondary" className="text-xs">Almoço</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatTime(record.start_time)} - {formatTime(record.end_time)}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-medium">
                            {Number(record.net_hours).toFixed(2)}h
                          </span>
                          <span className="font-bold text-success">
                            R$ {Number(record.total_value).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <OvertimeRecordActions 
                        record={record} 
                        onUpdate={fetchRecords}
                        onDelete={fetchRecords}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
