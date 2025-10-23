import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { isValidDate, isValidTime, sanitizeInput } from '@/utils/security';

const HOURLY_RATE = 15.57;

interface OvertimeRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  lunch_discount: boolean;
  net_hours: number;
  total_value: number;
}

interface OvertimeRecordActionsProps {
  record: OvertimeRecord;
  onUpdate: () => void;
  onDelete: () => void;
}

export function OvertimeRecordActions({ record, onUpdate, onDelete }: OvertimeRecordActionsProps) {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para edição
  const [editData, setEditData] = useState({
    date: record.date,
    startTime: record.start_time,
    endTime: record.end_time,
    lunchDiscount: record.lunch_discount,
  });

  const calculateOvertime = (startTime: string, endTime: string, hasLunch: boolean) => {
    if (!startTime || !endTime) return null;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const totalHours = totalMinutes / 60;
    const lunchDiscount = hasLunch;
    const netHours = lunchDiscount ? totalHours - 1 : totalHours;
    const totalValue = netHours * HOURLY_RATE;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      lunchDiscount,
      netHours: Math.round(netHours * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
    };
  };

  const handleEdit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Validação
      if (!editData.date || !editData.startTime || !editData.endTime) {
        throw new Error('Todos os campos são obrigatórios');
      }

      const sanitizedDate = sanitizeInput(editData.date);
      const sanitizedStartTime = sanitizeInput(editData.startTime);
      const sanitizedEndTime = sanitizeInput(editData.endTime);

      if (!isValidDate(sanitizedDate)) {
        throw new Error('Data inválida');
      }

      if (!isValidTime(sanitizedStartTime) || !isValidTime(sanitizedEndTime)) {
        throw new Error('Horário inválido');
      }

      // Calcular novos valores
      const calculation = calculateOvertime(sanitizedStartTime, sanitizedEndTime, editData.lunchDiscount);
      if (!calculation) {
        throw new Error('Erro no cálculo');
      }

      const { error } = await supabase
        .from('overtime_records')
        .update({
          date: sanitizedDate,
          start_time: sanitizedStartTime,
          end_time: sanitizedEndTime,
          total_hours: calculation.totalHours,
          lunch_discount: editData.lunchDiscount,
          net_hours: calculation.netHours,
          total_value: calculation.totalValue,
        })
        .eq('id', record.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Registro atualizado com sucesso!');
      setIsEditOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('overtime_records')
        .delete()
        .eq('id', record.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Registro excluído com sucesso!');
      setIsDeleteOpen(false);
      onDelete();
    } catch (error: any) {
      toast.error('Erro ao excluir registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = () => {
    if (editData.startTime && editData.endTime) {
      const calc = calculateOvertime(editData.startTime, editData.endTime, editData.lunchDiscount);
      // Atualizar os valores calculados se necessário
    }
  };

  return (
    <div className="flex gap-1">
      {/* Botão Editar */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Editar Registro</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-date" className="text-xs font-medium">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({...editData, date: e.target.value})}
                className="w-full text-sm h-9"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="edit-start" className="text-xs font-medium">Início</Label>
                <Input
                  id="edit-start"
                  type="time"
                  value={editData.startTime}
                  onChange={(e) => {
                    setEditData({...editData, startTime: e.target.value});
                    handleTimeChange();
                  }}
                  className="w-full text-sm h-9"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="edit-end" className="text-xs font-medium">Fim</Label>
                <Input
                  id="edit-end"
                  type="time"
                  value={editData.endTime}
                  onChange={(e) => {
                    setEditData({...editData, endTime: e.target.value});
                    handleTimeChange();
                  }}
                  className="w-full text-sm h-9"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg border">
              <Checkbox
                id="edit-lunch"
                checked={editData.lunchDiscount}
                onCheckedChange={(checked) => {
                  setEditData({...editData, lunchDiscount: !!checked});
                  handleTimeChange();
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-lunch" className="text-xs font-medium cursor-pointer flex-1">
                Fez almoço (-1h)
              </Label>
            </div>
            
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 text-xs h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isLoading}
                className="flex-1 text-xs h-8"
              >
                <Save className="h-3 w-3 mr-1" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão Apagar */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700">
            <Trash2 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </p>
            
            <div className="bg-muted/50 p-3 rounded-lg text-xs">
              <div className="flex justify-between">
                <span>Data:</span>
                <span>{new Date(record.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Horário:</span>
                <span>{record.start_time} - {record.end_time}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor:</span>
                <span>R$ {record.total_value.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isLoading}
                variant="destructive"
                className="flex-1 text-xs h-8"
              >
                {isLoading ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
