import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReminderSettings, useUpdateReminderSetting } from "@/hooks/useNotificationTemplates";
import { Loader2 } from "lucide-react";

export const ReminderManager = () => {
  const { data: reminders, isLoading } = useReminderSettings();
  const updateReminder = useUpdateReminderSetting();

  const handleUpdateDias = (id: string, dias: number) => {
    updateReminder.mutate({ id, dias_previos: dias });
  };

  const handleUpdateCanal = (id: string, canal: any) => {
    updateReminder.mutate({ id, canal_preferido: canal });
  };

  const handleToggleActivo = (id: string, activo: boolean) => {
    updateReminder.mutate({ id, activo });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evento</TableHead>
          <TableHead className="w-32">Días Previos</TableHead>
          <TableHead className="w-40">Canal</TableHead>
          <TableHead className="w-24">Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reminders?.map((reminder) => (
          <TableRow key={reminder.id}>
            <TableCell className="font-medium">{reminder.evento}</TableCell>
            <TableCell>
              <Input
                type="number"
                min="1"
                max="90"
                value={reminder.dias_previos}
                onChange={(e) => handleUpdateDias(reminder.id, parseInt(e.target.value))}
                className="w-20"
              />
            </TableCell>
            <TableCell>
              <Select
                value={reminder.canal_preferido}
                onValueChange={(value) => handleUpdateCanal(reminder.id, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Switch
                checked={reminder.activo}
                onCheckedChange={(checked) => handleToggleActivo(reminder.id, checked)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
