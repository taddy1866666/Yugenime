self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New Episode Released!';
    
    const options = {
      body: data.body || 'An episode is ready to watch on Yugenime.',
      icon: data.icon || '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification.data.url;
      
      // Validate URL to prevent open redirect
      if (targetUrl && !targetUrl.startsWith('/') && !targetUrl.startsWith(self.location.origin)) {
        console.error('Invalid notification URL:', targetUrl);
        return;
      }
      
      // Try to find an existing window/tab and focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            // Post message to update the app view if needed
            if (targetUrl && focusedClient.navigate) {
              return focusedClient.navigate(targetUrl);
            }
            return focusedClient;
          });
        }
      }
      
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl || '/');
      }
    })
  );
});
