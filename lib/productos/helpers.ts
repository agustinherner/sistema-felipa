export type VarianteFormState = {
  uid: string;
  id?: string;
  nombre: string;
  codigoBarras: string;
  precioPropio: boolean;
  precio: string;
  costo: string;
  stockInicial: string;
};

let uidCounter = 0;
function nuevoUid(): string {
  uidCounter += 1;
  return `v-${Date.now()}-${uidCounter}`;
}

export function nuevaVarianteVacia(): VarianteFormState {
  return {
    uid: nuevoUid(),
    nombre: '',
    codigoBarras: '',
    precioPropio: false,
    precio: '',
    costo: '',
    stockInicial: '',
  };
}
