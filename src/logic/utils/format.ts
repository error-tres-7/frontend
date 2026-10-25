const LOCALE = "es-MX";
export const TIME_ZONE = "America/Mexico_City";

const whole = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

/** `$1,860` for totals, `$32.00` with `cents` for prices and order amounts. */
export function mxn(amount: number, { decimals = false }: { decimals?: boolean } = {}) {
	return (decimals ? cents : whole).format(amount);
}

/** Signed movement amount: `+$98.00`, `−$260.00`. */
export function signed_mxn(amount: number) {
	return `${amount < 0 ? "−" : "+"}${mxn(Math.abs(amount), { decimals: true })}`;
}

export function percent(ratio: number) {
	return new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 2, signDisplay: "exceptZero" })
		.format(ratio)
		.replace("-", "−");
}

/** Rounds to cents without binary drift: 0.1 + 0.2 → 0.3. */
export function round_cents(amount: number) {
	return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** `YYYY-MM-DD` for the given instant in Mexico City, the date every merchant period uses. */
export function iso_day(instant = new Date()) {
	return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(instant);
}

function noon(day: string) {
	return new Date(`${day}T12:00:00Z`);
}

/** `Domingo 25 de octubre de 2026`. */
export function long_day(day: string) {
	const text = new Intl.DateTimeFormat(LOCALE, { dateStyle: "full", timeZone: "UTC" }).format(noon(day));
	return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}

/** `25 oct 2026`. */
export function short_day(day: string) {
	return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
		.format(noon(day))
		.replace(/\./g, "");
}

/** `25 oct`. */
export function day_month(day: string) {
	return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" })
		.format(noon(day))
		.replace(/\./g, "");
}

/** `Lun`, `Mié`… */
export function weekday(day: string) {
	const text = new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: "UTC" })
		.format(noon(day))
		.replace(".", "");
	return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}

/** `11:42` in Mexico City for an ISO instant. */
export function clock(instant: string) {
	return new Intl.DateTimeFormat(LOCALE, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: TIME_ZONE,
	}).format(new Date(instant));
}

export function greeting(hour: number) {
	if (hour >= 5 && hour < 12) return "Buenos días";
	if (hour >= 12 && hour < 19) return "Buenas tardes";
	return "Buenas noches";
}

export function current_hour(instant = new Date()) {
	return (
		Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: TIME_ZONE }).format(instant)) %
		24
	);
}
