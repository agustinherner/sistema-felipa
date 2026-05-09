export type ActionFail = { ok: false; errores: string[] };
export type ActionResult<T = unknown> = ({ ok: true } & T) | ActionFail;

export function fail(errores: string[]): ActionFail {
  return { ok: false, errores };
}

export type CrearVentaContexto = {
  userId: string;
  sucursalId: string;
  turnoId: string;
};
