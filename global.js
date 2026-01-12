document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // Create a MutationObserver to watch for attribute changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName.toLowerCase() === "contenteditable"
      ) {
        const current = body.getAttribute("contenteditable");

        if (current && current.toLowerCase() === "true") {
          body.setAttribute("contenteditable", "false");
          alert("Don't try to edit my page! ~Suomynona589");
        }
      }
    });
  });

  // Start observing the body for attribute changes
  observer.observe(body, {
    attributes: true,
    attributeFilter: ["contenteditable"]
  });

  // Also check immediately on load
  const initial = body.getAttribute("contenteditable");
  if (initial && initial.toLowerCase() === "true") {
    body.setAttribute("contenteditable", "false");
    alert("Don't try to edit my page! ~Suomynona589");
  }
});
