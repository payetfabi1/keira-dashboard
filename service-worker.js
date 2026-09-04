self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "Keira",
      body: event.data ? event.data.text() : ""
    };
  }

  const title = data.title || "Keira 🐱";

  const options = {
    body: data.body || "",
    icon: "./apple-touch-icon.png",
    badge: "./apple-touch-icon.png",
    data: {
      url: data.url || "./"
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();

    const targetUrl =
      event.notification.data?.url
      || "./";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clientList) => {

          for (const client of clientList) {

            if ("focus" in client) {
              client.navigate(targetUrl);
              return client.focus();
            }

          }

          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }

        })
    );
  }
);
