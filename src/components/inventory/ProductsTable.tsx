import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product } from "@/types/inventory";
import { useUpdateProduct } from "@/hooks/useProducts";

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const navigate = useNavigate();
  const updateProduct = useUpdateProduct();

  const handleToggleStatus = async (product: Product) => {
    await updateProduct.mutateAsync({
      id: product.id,
      activo: !product.activo
    });
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Precio Venta</TableHead>
            <TableHead>Precio Costo</TableHead>
            <TableHead>Stock Mínimo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-sm">
                {product.sku}
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  {product.nombre}
                  {product.serializable && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Serial
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>${product.precio_venta.toLocaleString('es-CL')}</TableCell>
              <TableCell>
                {product.precio_costo ? `$${product.precio_costo.toLocaleString('es-CL')}` : '-'}
              </TableCell>
              <TableCell>{product.stock_minimo}</TableCell>
              <TableCell>
                {product.activo ? (
                  <Badge className="bg-green-500">Activo</Badge>
                ) : (
                  <Badge variant="destructive">Inactivo</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/inventory/products/${product.id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/inventory/products/${product.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                      {product.activo ? 'Desactivar' : 'Activar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
