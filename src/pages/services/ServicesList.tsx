import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { ServicesTable } from "@/components/services/ServicesTable";
import { useServices, useDeleteService } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Service } from "@/types/services";

export default function ServicesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = {
    search,
    activo: activeFilter === "all" ? undefined : activeFilter === "active"
  };

  const { data: services, isLoading } = useServices(filters);
  const deleteService = useDeleteService();

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este servicio?")) {
      await deleteService.mutateAsync(id);
    }
  };

  const handleDuplicate = (service: Service) => {
    navigate("/services/new", { state: { duplicate: service } });
  };

  const handleExportCSV = () => {
    if (!services || services.length === 0) {
      toast.error("No hay servicios para exportar");
      return;
    }

    const headers = ["Nombre", "Descripción", "Precio", "Tiempo (min)", "Activo"];
    const rows = services.map(s => [
      s.nombre,
      s.descripcion || "",
      s.precio_base,
      s.tiempo_estimado_minutos,
      s.activo ? "Sí" : "No"
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servicios_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Servicios exportados");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Catálogo de Servicios"
        description="Gestiona los servicios disponibles"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={() => navigate("/services/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Buscar servicios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ServicesTable
        services={services || []}
        isLoading={isLoading}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </PageContainer>
  );
}
