import { writable } from 'svelte/store';

export const toasts = writable([]);

let counter = 0;

export function notify(type, message, duration = 4000) {
  const id = ++counter;
  toasts.update((list) => [...list, { id, type, message }]);
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
}

export function dismiss(id) {
  toasts.update((list) => list.filter((t) => t.id !== id));
}

export function success(message) {
  notify('success', message);
}

export function warning(message) {
  notify('warning', message);
}

export function error(message, duration = 0) {
  notify('error', message, duration);
}

export function info(message) {
  notify('info', message);
}