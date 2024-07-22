function injectScript(src) {
  if (document.querySelector[`script[src="${src}"]`]) return;

  const script = document.createElement("script");
  script.src = src;
  script.type = "module";

  document.body.appendChild(script);
}

injectScript("http://localhost:9090/live-reload.js");

console.log("hello :)");
