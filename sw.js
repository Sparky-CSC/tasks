// Theatre To-Do List Service Worker
// Handles background push notifications for task reminders

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Handle push notifications from server (future use)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || '🔔 Task Reminder', {
      body: data.body || 'You have a task reminder.',
      icon: '/Theatre-To-Do-List/favicon.ico',
      badge: '/Theatre-To-Do-List/favicon.ico',
      tag: data.taskId ? `task-${data.taskId}` : 'task-reminder',
      data: { taskId: data.taskId, url: data.url || '/' },
      actions: [
        { action: 'done', title: '✅ Done' },
        { action: 'working', title: '🔄 Still on it' }
      ],
      requireInteraction: true
    })
  );
});

// Handle notification action clicks
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const taskId = e.notification.data?.taskId;

  if (e.action === 'done' && taskId) {
    // Notify the client page to mark complete
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          client.postMessage({ type: 'REMINDER_DONE', taskId });
          return;
        }
        // No window open — open the app
        clients.openWindow('/Theatre-To-Do-List/');
      })
    );
  } else if (e.action === 'working' && taskId) {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          client.postMessage({ type: 'REMINDER_STILL_WORKING', taskId });
          return;
        }
      })
    );
  } else {
    // Default: focus or open the app
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        clients.openWindow('/Theatre-To-Do-List/');
      })
    );
  }
});
