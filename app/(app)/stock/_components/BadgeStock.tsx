import { Badge } from '@/components/ui/badge';
import { clasificarStock } from '@/lib/stock/helpers';

export function BadgeStock({ cantidad }: { cantidad: number }) {
  const kind = clasificarStock(cantidad);

  if (kind === 'ok') {
    return <span className="font-medium tabular-nums">{cantidad}</span>;
  }
  if (kind === 'negativo') {
    return (
      <Badge variant="destructive" className="tabular-nums">
        {cantidad} (revisar)
      </Badge>
    );
  }
  if (kind === 'sin-stock') {
    return <Badge variant="secondary">Sin stock</Badge>;
  }
  return (
    <Badge className="border-transparent bg-amber-100 tabular-nums text-amber-900 hover:bg-amber-100/80">
      {cantidad} bajo
    </Badge>
  );
}
