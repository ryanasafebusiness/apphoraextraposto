import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Download, 
  Search,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
}

interface OvertimeRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  lunch_discount: boolean;
  net_hours: number;
  total_value: number;
  user_id: string;
  created_at: string;
}

interface EmployeeWithStats extends Profile {
  totalHours: number;
  totalValue: number;
  recordCount: number;
}

interface TopEmployee {
  id: string;
  full_name: string;
  totalHours: number;
  totalValue: number;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalHours: 0,
    totalValue: 0,
    averageHours: 0,
  });
  const [topEmployees, setTopEmployees] = useState<TopEmployee[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchAllData();
  }, [isAdmin, navigate]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchGlobalStats(),
        fetchTopEmployees()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      const { data: records, error: recordsError } = await supabase
        .from('overtime_records')
        .select('user_id, net_hours, total_value');

      if (recordsError) throw recordsError;

      // Calcular estatísticas por funcionário
      const employeeStats = (profiles || []).map(profile => {
        const employeeRecords = (records || []).filter(r => r.user_id === profile.id);
        const totalHours = employeeRecords.reduce((sum, r) => sum + Number(r.net_hours), 0);
        const totalValue = employeeRecords.reduce((sum, r) => sum + Number(r.total_value), 0);
        
        return {
          ...profile,
          totalHours: Math.round(totalHours * 100) / 100,
          totalValue: Math.round(totalValue * 100) / 100,
          recordCount: employeeRecords.length,
        };
      });

      setEmployees(employeeStats);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const { data, error } = await supabase
        .from('overtime_records')
        .select('net_hours, total_value');

      if (error) throw error;

      const totalHours = (data || []).reduce((sum, r) => sum + Number(r.net_hours), 0);
      const totalValue = (data || []).reduce((sum, r) => sum + Number(r.total_value), 0);
      const totalEmployees = employees.length;
      const averageHours = totalEmployees > 0 ? totalHours / totalEmployees : 0;

      setStats({
        totalEmployees,
        totalHours: Math.round(totalHours * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        averageHours: Math.round(averageHours * 100) / 100,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTopEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('overtime_records')
        .select(`
          user_id,
          net_hours,
          total_value,
          profiles!inner(full_name)
        `);

      if (error) throw error;

      // Agrupar por funcionário e calcular totais
      const employeeTotals = (data || []).reduce((acc: any, record: any) => {
        const userId = record.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            id: userId,
            full_name: record.profiles.full_name,
            totalHours: 0,
            totalValue: 0,
          };
        }
        acc[userId].totalHours += Number(record.net_hours);
        acc[userId].totalValue += Number(record.total_value);
        return acc;
      }, {});

      // Converter para array e ordenar por horas
      const topEmployeesList = Object.values(employeeTotals)
        .map((emp: any) => ({
          ...emp,
          totalHours: Math.round(emp.totalHours * 100) / 100,
          totalValue: Math.round(emp.totalValue * 100) / 100,
        }))
        .sort((a: any, b: any) => b.totalHours - a.totalHours)
        .slice(0, 5);

      setTopEmployees(topEmployeesList);
    } catch (error) {
      console.error('Error fetching top employees:', error);
    }
  };

  const fetchEmployeeRecords = async (userId: string, dateFilter?: string) => {
    try {
      let query = supabase
        .from('overtime_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (dateFilter) {
        const [year, month] = dateFilter.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching employee records:', error);
    }
  };

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    if (value) {
      fetchEmployeeRecords(value, dateFilter);
    } else {
      setRecords([]);
    }
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    if (selectedEmployee) {
      fetchEmployeeRecords(selectedEmployee, value);
    }
  };

  const exportEmployeeData = () => {
    if (!selectedEmployeeData || records.length === 0) return;

    const csvContent = [
      ['Data', 'Período', 'Total Horas', 'Desconto Almoço', 'Horas Válidas', 'Valor'],
      ...records.map(record => [
        formatDate(record.date),
        `${formatTime(record.start_time)} - ${formatTime(record.end_time)}`,
        record.total_hours.toString(),
        record.lunch_discount ? 'Sim' : 'Não',
        record.net_hours.toString(),
        record.total_value.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedEmployeeData.full_name}_relatorio.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf.includes(searchTerm)
  );

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Visão geral e gestão de dados de todos os funcionários
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Gerenciamento</span>
              <span className="sm:hidden">Gestão</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard
              totalHours={stats.totalHours}
              totalValue={stats.totalValue}
              totalEmployees={stats.totalEmployees}
              averageHours={stats.averageHours}
              employees={employees}
              onGenerateReport={() => {
                console.log('Relatório gerado com sucesso!');
              }}
            />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Visão Geral - Cards de Estatísticas */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Funcionários cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-primary">
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
                  <div className="text-xl sm:text-2xl font-bold text-success">
                    R$ {stats.totalValue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor acumulado geral
                  </p>
                </CardContent>
          </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Média por Funcionário</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {stats.averageHours.toFixed(2)}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Média de horas extras
                  </p>
                </CardContent>
              </Card>
        </div>

            {/* Top 5 Funcionários */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Funcionários</CardTitle>
                <CardDescription>
                  Funcionários com maior quantidade de horas extras acumuladas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum funcionário com horas extras registradas
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {topEmployees.map((employee, index) => (
                      <div key={employee.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{employee.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {employee.totalHours.toFixed(2)}h • R$ {employee.totalValue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {employee.totalHours.toFixed(2)}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="space-y-4 sm:space-y-6">
            {/* Lista de Funcionários */}
        <Card>
          <CardHeader>
                <CardTitle>Gerenciamento de Funcionários</CardTitle>
            <CardDescription>
                  Lista completa de funcionários com resumo de horas extras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                  {/* Busca */}
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar funcionário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Tabela de Funcionários */}
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Nome</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">CPF</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden md:table-cell">Email</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">Horas</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">Valor</TableHead>
                          <TableHead className="text-center text-xs sm:text-sm">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">
                              <div>
                                <div className="font-medium">{employee.full_name}</div>
                                <div className="text-xs text-muted-foreground sm:hidden">{employee.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{employee.cpf}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs sm:text-sm">{employee.email}</TableCell>
                            <TableCell className="text-right font-semibold text-primary text-xs sm:text-sm">
                              {employee.totalHours.toFixed(2)}h
                            </TableCell>
                            <TableCell className="text-right font-bold text-success text-xs sm:text-sm">
                              R$ {employee.totalValue.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEmployeeChange(employee.id)}
                                className="text-xs px-2 py-1"
                              >
                                <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Ver Detalhes</span>
                                <span className="sm:hidden">Ver</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relatório Detalhado do Funcionário Selecionado */}
            {selectedEmployee && selectedEmployeeData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Relatório Detalhado</CardTitle>
                      <CardDescription>
                        Histórico completo de {selectedEmployeeData.full_name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportEmployeeData}
                        disabled={records.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="date-filter" className="text-xs sm:text-sm">Filtrar por mês:</Label>
                        <Input
                          id="date-filter"
                          type="month"
                          value={dateFilter}
                          onChange={(e) => handleDateFilterChange(e.target.value)}
                          className="w-32 sm:w-40 text-xs sm:text-sm"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateFilter('');
                          handleDateFilterChange('');
                        }}
                        className="text-xs"
                      >
                        Limpar Filtro
                      </Button>
                    </div>

                    {/* Resumo do Funcionário */}
                    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 p-3 sm:p-4 border rounded-lg bg-muted/30">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium text-sm sm:text-base truncate">{selectedEmployeeData.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">CPF</p>
                        <p className="font-medium text-sm sm:text-base">{selectedEmployeeData.cpf}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Horas</p>
                        <p className="font-bold text-primary text-sm sm:text-base">{selectedEmployeeData.totalHours.toFixed(2)}h</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Valor</p>
                        <p className="font-bold text-success text-sm sm:text-base">R$ {selectedEmployeeData.totalValue.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Tabela de Lançamentos */}
              {records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum registro encontrado</p>
                        <p className="text-sm mt-1">
                          {dateFilter ? 'Tente alterar o filtro de data' : 'Este funcionário ainda não possui lançamentos'}
                        </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Total Horas</TableHead>
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
                            {Number(record.total_hours).toFixed(2)}h
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
                  </div>
            </CardContent>
          </Card>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
