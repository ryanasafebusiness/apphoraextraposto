import React from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm shadow-lg backdrop-blur-sm">
        <p className="text-slate-800 dark:text-slate-200">{`Valor: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// --- STAT CARD COMPONENT ---
function StatCard({ title, value, change, changeType, icon: Icon, chartData, description }: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ComponentType<any>;
  chartData: any[];
  description?: string;
}) {
  const chartColor = changeType === 'positive' ? '#10b981' : '#ef4444';

  return (
    <Card className="group transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 cursor-pointer border-slate-200 dark:border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{value}</p>
            <p className={`text-xs mt-1 ${changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {change}
            </p>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">{description}</p>
            )}
          </div>
          <div className="h-10 w-20 sm:h-12 sm:w-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id={`colorUv-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: 'rgba(148, 163, 184, 0.3)',
                    strokeWidth: 1,
                    strokeDasharray: '3 3',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="uv"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                  fillOpacity={1}
                  fill={`url(#colorUv-${title})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- DASHBOARD COMPONENT ---
export default function AnalyticsDashboard({ 
  totalHours = 0, 
  totalValue = 0, 
  totalEmployees = 0, 
  averageHours = 0,
  employees = [],
  onGenerateReport 
}: {
  totalHours?: number;
  totalValue?: number;
  totalEmployees?: number;
  averageHours?: number;
  employees?: Array<{
    id: string;
    full_name: string;
    email: string;
    cpf: string;
    totalHours: number;
    totalValue: number;
  }>;
  onGenerateReport?: () => void;
}) {
  // Função para gerar e baixar relatório em CSV
  const generateReport = () => {
    if (employees.length === 0) {
      alert('Nenhum funcionário encontrado para gerar o relatório.');
      return;
    }

    // Cabeçalho do CSV
    const csvContent = [
      ['Nome', 'Email', 'CPF', 'Total de Horas Extras', 'Valor Total (R$)', 'Data do Relatório'],
      ...employees.map(employee => [
        employee.full_name,
        employee.email,
        employee.cpf,
        employee.totalHours.toFixed(2),
        employee.totalValue.toFixed(2),
        new Date().toLocaleDateString('pt-BR')
      ]),
      // Linha de totais
      ['', '', '', totalHours.toFixed(2), totalValue.toFixed(2), 'TOTAL GERAL']
    ].map(row => row.join(',')).join('\n');

    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_horas_extras_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Chamar callback se fornecido
    if (onGenerateReport) {
      onGenerateReport();
    }
  };

  // Dados mockados para os gráficos - em produção, estes viriam de props ou API
  const analyticsData = [
    {
      title: 'Total de Horas',
      value: `${totalHours.toFixed(2)}h`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Clock,
      description: 'Horas extras acumuladas',
      chartData: [
        { name: 'Jan', uv: 120 },
        { name: 'Fev', uv: 150 },
        { name: 'Mar', uv: 180 },
        { name: 'Abr', uv: 200 },
        { name: 'Mai', uv: 220 },
        { name: 'Jun', uv: 250 },
        { name: 'Jul', uv: totalHours },
      ],
    },
    {
      title: 'Valor Total',
      value: `R$ ${totalValue.toFixed(2)}`,
      change: '+18.2%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'Valor acumulado em reais',
      chartData: [
        { name: 'Jan', uv: 4500 },
        { name: 'Fev', uv: 5200 },
        { name: 'Mar', uv: 6100 },
        { name: 'Abr', uv: 6800 },
        { name: 'Mai', uv: 7500 },
        { name: 'Jun', uv: 8200 },
        { name: 'Jul', uv: totalValue },
      ],
    },
    {
      title: 'Funcionários',
      value: `${totalEmployees}`,
      change: '+2 novos',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Total de funcionários',
      chartData: [
        { name: 'Jan', uv: 8 },
        { name: 'Fev', uv: 9 },
        { name: 'Mar', uv: 10 },
        { name: 'Abr', uv: 11 },
        { name: 'Mai', uv: 12 },
        { name: 'Jun', uv: 13 },
        { name: 'Jul', uv: totalEmployees },
      ],
    },
    {
      title: 'Média por Funcionário',
      value: `${averageHours.toFixed(2)}h`,
      change: '+5.1%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'Média de horas extras',
      chartData: [
        { name: 'Jan', uv: 15 },
        { name: 'Fev', uv: 16.5 },
        { name: 'Mar', uv: 18 },
        { name: 'Abr', uv: 18.2 },
        { name: 'Mai', uv: 18.3 },
        { name: 'Jun', uv: 19.2 },
        { name: 'Jul', uv: averageHours },
      ],
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <header className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Dashboard Analítico
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Bem-vindo! Aqui está o resumo de performance do sistema.
          </p>
        </div>
        <Button
          onClick={generateReport}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
        >
          Gerar Relatório
        </Button>
      </header>

      <main className="mt-4 sm:mt-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {analyticsData.map((data) => (
            <StatCard
              key={data.title}
              title={data.title}
              value={data.value}
              change={data.change}
              changeType={data.changeType}
              icon={data.icon}
              chartData={data.chartData}
              description={data.description}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
