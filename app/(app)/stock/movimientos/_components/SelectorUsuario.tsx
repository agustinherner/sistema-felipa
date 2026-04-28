'use client';

import { Select } from '@/components/ui/select';

type Props = {
  usuarios: { id: string; nombre: string }[];
  value: string;
  onChange: (id: string) => void;
};

export function SelectorUsuario({ usuarios, value, onChange }: Props) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filtrar por usuario"
    >
      <option value="">Todos los usuarios</option>
      {usuarios.map((u) => (
        <option key={u.id} value={u.id}>
          {u.nombre}
        </option>
      ))}
    </Select>
  );
}
