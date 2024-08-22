document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const cookies = await chrome.cookies.getAll({ url: tab.url });

  const cookiesBody = document.getElementById("cookiesBody");
  const noCookiesMessage = document.getElementById("noCookiesMessage");
  const cookieForm = document.getElementById("cookieForm");

  // Function to render the cookies in the table
  function renderCookies(cookiesList) {
    cookiesBody.innerHTML = ""; // Clear previous content
    cookiesList.forEach((cookie) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${cookie.name} <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium copy-icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ContentCopyIcon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg></td>
          <td><span title="${cookie.value}" class="text-ellipsis">${cookie.value}</span></td>
          <td>
            <button title="Copy Cookie" id="copyCookie" class="btn btn-copy">COPY</button>
            <button class="btn btn-edit" data-cookie-name="${cookie.name}" data-cookie-domain="${cookie.domain}">Edit</button>
          </td>
        `;
      cookiesBody.appendChild(row);
    });
  }

  // Initial rendering of all cookies
  renderCookies(cookies);

  // Search filter logic
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCookies = cookies.filter((cookie) =>
      cookie.name.toLowerCase().includes(searchTerm)
    );

    if (filteredCookies.length > 0) {
      renderCookies(filteredCookies);
      noCookiesMessage.style.display = "none";
    } else {
      cookiesBody.innerHTML = ""; // Clear the table if no cookies match
      noCookiesMessage.style.display = "block";
    }
  });

  // Function to add or update cookies
  cookieForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("cookieName").value;
    const value = document.getElementById("cookieValue").value;
    const domain = document.getElementById("cookieDomain").value;
    const path = document.getElementById("cookiePath").value;

    try {
      // Add or update the cookie
      await chrome.cookies.set({
        url: tab.url,
        name: name,
        value: value,
        domain: domain,
        path: path,
      });

      // Reload cookies after setting a new one
      const updatedCookies = await chrome.cookies.getAll({ url: tab.url });
      renderCookies(updatedCookies);

      // Reset form
      cookieForm.reset();
      alert("Cookie added/updated successfully!");
    } catch (error) {
      console.error("Error setting cookie:", error);
      alert("Failed to add/update cookie");
    }
  });

  // Edit existing cookie by pre-filling the form
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-btn")) {
      const cookieName = e.target.getAttribute("data-cookie-name");
      const cookieDomain = e.target.getAttribute("data-cookie-domain");

      // Get the specific cookie and fill the form with its data
      const cookieToEdit = await chrome.cookies.get({
        name: cookieName,
        url: tab.url,
      });

      if (cookieToEdit) {
        document.getElementById("cookieName").value = cookieToEdit.name;
        document.getElementById("cookieValue").value = cookieToEdit.value;
        document.getElementById("cookieDomain").value = cookieToEdit.domain;
        document.getElementById("cookiePath").value = cookieToEdit.path;
      }
    }
  });
});
