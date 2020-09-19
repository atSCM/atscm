/* eslint-disable import/prefer-default-export */

/**
 * Returns a Promise that resolves once the given event is emitted.
 * @param {events~Emitter} emitter The emitter that should emit the event.
 * @param {string} eventName Name of the event to wait for.
 * @return {Promise} Resolves once *emitter* emits an *eventName* event.
 */
export function waitForEvent(emitter, eventName) {
  return new Promise(resolve => {
    emitter.once(eventName, resolve);
  });
}
