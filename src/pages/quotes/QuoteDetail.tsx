import { useParams } from 'react-router-dom';

export default function QuoteDetail() {
  const { id } = useParams();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Detalle de Cotización</h1>
      <p className="text-muted-foreground mt-2">ID: {id}</p>
      <p className="text-muted-foreground">En construcción...</p>
    </div>
  );
}
