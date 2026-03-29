/**
 * Ritmos de muestreo OBD para la UI durante sesión en vivo.
 * El transporte SPP es serial: un lote largo de comandos retrasa RPM/velocidad.
 */

/** Intervalo entre lecturas "rápidas" (Mode 01) en condiciones normales. */
export const OBD_POLL_FAST_MS = 120

/**
 * Intervalo entre lecturas rápidas en modo de grabación/alta frecuencia.
 * Más bajo = más datos pero mayor carga sobre el adaptador.
 */
export const OBD_POLL_FAST_MS_RECORDING = 88

/**
 * Cuánto esperar entre lotes "pesados" (DTC + PIDs extra Mode 01).
 * Más bajo = más datos en pantalla pero más bloqueo del adaptador.
 */
export const OBD_POLL_SLOW_MS = 2000
