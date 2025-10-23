import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { isValidDate, isValidTime, sanitizeInput } from '@/utils/security';

const HOURLY_RATE = 15.57;

export function AddOvertimeDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calculation, setCalculation] = useState<{
    totalHours: number;
    lunchDiscount: boolean;
    netHours: number;
    totalValue: number;
  } | null>(null);

  const calculateOvertime = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return null;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts

    const totalHours = totalMinutes / 60;
    const lunchDiscount = totalHours >= 6;
    const netHours = lunchDiscount ? totalHours - 1 : totalHours;
    const totalValue = netHours * HOURLY_RATE;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      lunchDiscount,
      netHours: Math.round(netHours * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
    };
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.currentTarget.form;
    if (!form) return;

    const formData = new FormData(form);
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (startTime && endTime) {
      const calc = calculateOvertime(startTime, endTime);
      setCalculation(calc);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !calculation) return;

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const date = formData.get('date') as string;
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;

      // Input validation and sanitization
      if (!date || !startTime || !endTime) {
        throw new Error('Todos os campos são obrigatórios');
      }

      const sanitizedDate = sanitizeInput(date);
      const sanitizedStartTime = sanitizeInput(startTime);
      const sanitizedEndTime = sanitizeInput(endTime);

      if (!isValidDate(sanitizedDate)) {
        throw new Error('Data inválida');
      }

      if (!isValidTime(sanitizedStartTime) || !isValidTime(sanitizedEndTime)) {
        throw new Error('Horário inválido');
      }

      // Validate date is not in the future
      const inputDate = new Date(sanitizedDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (inputDate > today) {
        throw new Error('Não é possível registrar horas extras para datas futuras');
      }

      // Validate time range
      const start = new Date(`2000-01-01T${sanitizedStartTime}`);
      const end = new Date(`2000-01-01T${sanitizedEndTime}`);
      
      if (start >= end) {
        throw new Error('Horário de fim deve ser posterior ao horário de início');
      }

      const { error } = await supabase.from('overtime_records').insert({
        user_id: user.id,
        date: sanitizedDate,
        start_time: sanitizedStartTime,
        end_time: sanitizedEndTime,
        total_hours: calculation.totalHours,
        lunch_discount: calculation.lunchDiscount,
        net_hours: calculation.netHours,
        hourly_rate: HOURLY_RATE,
        total_value: calculation.totalValue,
      });

      if (error) throw error;

      toast.success('Hora extra registrada com sucesso!');
      setOpen(false);
      setCalculation(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar hora extra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Hora Extra
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Hora Extra</DialogTitle>
          <DialogDescription>
            Preencha os dados da hora extra. Valor: R$ {HOURLY_RATE}/hora
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Início</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                required
                onChange={handleTimeChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Fim</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                required
                onChange={handleTimeChange}
              />
            </div>
          </div>
          
          {calculation && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span>Cálculo Automático:</span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de Horas:</span>
                    <span className="font-medium">{calculation.totalHours.toFixed(2)}h</span>
                  </div>
                  
                  {calculation.lunchDiscount && (
                    <div className="flex justify-between text-amber-600">
                      <span>Desconto Almoço:</span>
                      <span className="font-medium">-1.00h</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-muted-foreground">Horas Válidas:</span>
                    <span className="font-semibold">{calculation.netHours.toFixed(2)}h</span>
                  </div>
                  
                  <div className="flex justify-between text-success border-t pt-1">
                    <span className="font-medium">Valor Total:</span>
                    <span className="font-bold text-lg">
                      R$ {calculation.totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !calculation}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
