/**
 * Helpers de timezone para Felipa.
 *
 * Felipa opera en La Pampa, Argentina (UTC−3 fijo, sin horario de verano).
 * El server de Vercel corre en UTC y Neon en São Paulo. Los timestamps en la DB
 * (`creadaEn`, `aperturaEn`, `cierreEn`, etc.) están en UTC.
 *
 * Si filtramos por "hoy" o "este mes" usando la fecha del server (UTC), las
 * ventas de la franja nocturna (21:00–23:59 hora AR, que en UTC es 00:00–02:59
 * del día siguiente) caen en el día equivocado.
 *
 * Estos helpers reciben un Date "ahora" (o fechas civiles AR) y devuelven los
 * límites del día / mes / rango en **hora argentina**, expresados como Date
 * UTC para filtrar contra la DB.
 */

const AR_TZ = 'America/Argentina/Buenos_Aires';
/** UTC−3 fijo. AR no observa horario de verano desde 2009. */
const AR_OFFSET_HOURS = 3;

type FechaCivil = { year: number; month: number; day: number };

/**
 * Extrae el año/mes/día de la fecha civil argentina correspondiente al Date
 * dado. Usa Intl con timezone AR para no depender de la TZ del runtime.
 */
function fechaCivilAR(d: Date): FechaCivil {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  };
}

/**
 * Convierte una fecha civil AR + hora civil AR a un Date UTC.
 * AR 00:00 → UTC 03:00 del mismo día (UTC−3 fijo).
 * Aprovechamos que Date.UTC normaliza overflow (h=26 → siguiente día 02:00).
 */
function utcDesdeCivilAR(
  year: number,
  month: number,
  day: number,
  h = 0,
  m = 0,
  s = 0,
  ms = 0,
): Date {
  return new Date(
    Date.UTC(year, month - 1, day, h + AR_OFFSET_HOURS, m, s, ms),
  );
}

/**
 * Límites del día argentino que contiene a `now`.
 * - desde: 00:00:00.000 AR → UTC 03:00:00 del mismo día civil
 * - hasta: 23:59:59.999 AR → UTC 02:59:59.999 del día civil siguiente
 */
export function rangoDiaAR(now: Date): { desde: Date; hasta: Date } {
  const { year, month, day } = fechaCivilAR(now);
  const desde = utcDesdeCivilAR(year, month, day, 0, 0, 0, 0);
  const hasta = utcDesdeCivilAR(year, month, day, 23, 59, 59, 999);
  return { desde, hasta };
}

/**
 * Límites del mes argentino que contiene a `now`.
 * - desde: primer instante del primer día del mes AR
 * - hasta: último instante del último día del mes AR (calculado como
 *   inicio del mes siguiente − 1ms para evitar bugs de fin de mes).
 */
export function rangoMesAR(now: Date): { desde: Date; hasta: Date } {
  const { year, month } = fechaCivilAR(now);
  const desde = utcDesdeCivilAR(year, month, 1, 0, 0, 0, 0);
  const proxMes = month === 12 ? 1 : month + 1;
  const proxAnio = month === 12 ? year + 1 : year;
  const inicioProx = utcDesdeCivilAR(proxAnio, proxMes, 1, 0, 0, 0, 0);
  const hasta = new Date(inicioProx.getTime() - 1);
  return { desde, hasta };
}

/**
 * Límites de un rango arbitrario entre dos fechas civiles AR, inclusivo
 * en ambos extremos. Acepta strings `YYYY-MM-DD` (formato de inputs HTML
 * `<input type="date">`).
 *
 * Lanza si las fechas no parsean o si `desdeCivil > hastaCivil`.
 */
export function rangoEntreFechasAR(
  desdeCivil: string,
  hastaCivil: string,
): { desde: Date; hasta: Date } {
  const dParts = desdeCivil.split('-').map(Number);
  const hParts = hastaCivil.split('-').map(Number);
  if (
    dParts.length !== 3 ||
    hParts.length !== 3 ||
    dParts.some(Number.isNaN) ||
    hParts.some(Number.isNaN)
  ) {
    throw new Error(
      `Fecha inválida: esperaba YYYY-MM-DD, recibí "${desdeCivil}" / "${hastaCivil}"`,
    );
  }
  const [yD, mD, dD] = dParts;
  const [yH, mH, dH] = hParts;
  const desde = utcDesdeCivilAR(yD, mD, dD, 0, 0, 0, 0);
  const hasta = utcDesdeCivilAR(yH, mH, dH, 23, 59, 59, 999);
  if (desde.getTime() > hasta.getTime()) {
    throw new Error('El "desde" no puede ser posterior al "hasta".');
  }
  return { desde, hasta };
}

/** Útil para tests y debugging: devuelve la fecha civil AR como string `YYYY-MM-DD`. */
export function fechaCivilAR_ISO(d: Date): string {
  const { year, month, day } = fechaCivilAR(d);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
