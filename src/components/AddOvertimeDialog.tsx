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
import { Plus, Calculator, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { isValidDate, isValidTime, sanitizeInput } from '@/utils/security';

const HOURLY_RATE = 15.57;

export function AddOvertimeDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lunchDiscount, setLunchDiscount] = useState(false);
  const [calculation, setCalculation] = useState<{
    totalHours: number;
    lunchDiscount: boolean;
    netHours: number;
    totalValue: number;
  } | null>(null);

  const calculateOvertime = (startTime: string, endTime: string, hasLunch: boolean) => {
    if (!startTime || !endTime) return null;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts

    const totalHours = totalMinutes / 60;
    const lunchDiscount = hasLunch; // Use the checkbox value
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
      const calc = calculateOvertime(startTime, endTime, lunchDiscount);
      setCalculation(calc);
    }
  };

  const handleLunchChange = (checked: boolean) => {
    setLunchDiscount(checked);
    const form = document.querySelector('form');
    if (!form) return;

    const formData = new FormData(form);
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (startTime && endTime) {
      const calc = calculateOvertime(startTime, endTime, checked);
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
        lunch_discount: lunchDiscount,
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
        <Button size="lg" className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Adicionar Hora Extra</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Registrar Hora Extra</DialogTitle>
          <DialogDescription className="text-xs">
            Valor: R$ {HOURLY_RATE}/hora
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="date" className="text-xs font-medium">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full text-sm h-9"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="startTime" className="text-xs font-medium">Início</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                required
                onChange={handleTimeChange}
                className="w-full text-sm h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="endTime" className="text-xs font-medium">Fim</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                required
                onChange={handleTimeChange}
                className="w-full text-sm h-9"
              />
            </div>
          </div>

          {/* Checkbox para horário de almoço */}
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg border">
            <Checkbox
              id="lunchDiscount"
              checked={lunchDiscount}
              onCheckedChange={handleLunchChange}
              className="h-4 w-4"
            />
            <Label htmlFor="lunchDiscount" className="text-xs font-medium cursor-pointer flex-1">
              Fez almoço (-1h)
            </Label>
          </div>
          
          {calculation && (
            <Card className="bg-muted/50">
              <CardContent className="pt-2 space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Calculator className="h-3 w-3 text-primary" />
                  <span>Cálculo:</span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{calculation.totalHours.toFixed(2)}h</span>
                  </div>
                  
                  {calculation.lunchDiscount && (
                    <div className="flex justify-between text-amber-600">
                      <span>Almoço:</span>
                      <span className="font-medium">-1.00h</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-muted-foreground">Líquido:</span>
                    <span className="font-semibold">{calculation.netHours.toFixed(2)}h</span>
                  </div>
                  
                  <div className="flex justify-between text-success border-t pt-1">
                    <span className="font-medium">Valor:</span>
                    <span className="font-bold text-sm">
                      R$ {calculation.totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !calculation}
              className="flex-1 text-xs h-8"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
