const eventSource = new EventSource("http://localhost:9090/events");

eventSource.addEventListener("message", (e) => {
  const { message, action } = JSON.parse(e.data);
  console.log(message);

  if (action === "reload") {
    window.location.reload();
  }
  if (action === "close") {
    eventSource.close();
  }
});

eventSource.addEventListener("error", (e) => {
  console.error(e.data);
});
