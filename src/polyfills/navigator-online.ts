/**
 * Polyfill for navigator.onLine in Hermes (React Native production runtime).
 *
 * Hermes does not define navigator.onLine, which causes Clerk to interpret the
 * device as offline and silently skip all API calls. This must be imported
 * BEFORE any Clerk module.
 */
if (
  typeof globalThis !== "undefined" &&
  typeof globalThis.navigator !== "undefined" &&
  typeof globalThis.navigator.onLine !== "boolean"
) {
  Object.defineProperty(globalThis.navigator, "onLine", {
    get: () => true,
    configurable: true,
    enumerable: true,
  });
}
