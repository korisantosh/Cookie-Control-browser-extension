document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const cookies = await chrome.cookies.getAll({ url: tab.url });
  const cookiesBody = document.getElementById("cookiesBody");
  const cookieForm = document.getElementById("cookieForm");
  const cookieNameInput = document.getElementById("cookieName");
  const cookieValueInput = document.getElementById("cookieValue");
  const addCookieButton = document.getElementById("addCookieButton");
  const updateTitle = "Update";
  const addTitle = "Add";
  const updateCookieWrapper = document.getElementById("updateCookieWrapper");
  const content = document.getElementById("content");
  const noCookieRow = document.getElementById("noCookieRow");
  const topActions = document.getElementById("topActions");
  const addUpdateCTA = document.getElementById("addUpdateCTA");
  const searchInput = document.getElementById("searchInput");
  // Enable button when both fields have values
  const validateInputs = () => {
    const isCookieNameFilled = cookieNameInput.value.trim() !== "";
    const isCookieValueFilled = cookieValueInput.value.trim() !== "";
    addCookieButton.disabled = !(isCookieNameFilled && isCookieValueFilled);
  };
  // Listen for input changes on both fields
  cookieNameInput.addEventListener("input", validateInputs);
  cookieValueInput.addEventListener("input", validateInputs);
  // Function to render the cookies in the table
  function renderCookies(cookiesList) {
    cookiesBody.innerHTML = ""; // Clear previous content
    cookiesList.forEach((cookie, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td id="row-${index}"><div class="cookie-item"><span title="${cookie.name}" class="text-ellipsis">${cookie.name}</span><span class="action-ctas"><svg class="copy-cookie-icon" data-cookie="${cookie.name}" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg></span></div></div></td>
          <td class="cookie-value"><div class="cookie-item"><span title="${cookie.value}" class="text-ellipsis">${cookie.value}</span><span class="action-ctas"><svg title="Copy Cookie" class="copy-cookie-icon" data-cookie="${cookie.value}"  focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg><svg class="edit-icon" title="Edit Cookie" data-row-index="row-${index}" data-cookie-name="${cookie.name}" data-cookie-value="${cookie.value}" focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></span></div></td>
        `;
      cookiesBody.appendChild(row);
    });
  }
  // Initial rendering of all cookies
  renderCookies(cookies);
  // Search filter logic
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const hasValue = (searchTerm.trim().length > 0) ? searchInput.classList.add("has-value") : searchInput.classList.remove("has-value");
    const filteredCookies = cookies.filter((cookie) =>
      cookie.name.toLowerCase().includes(searchTerm)
    );
    if (filteredCookies.length > 0) {
      renderCookies(filteredCookies);
      noCookieRow.classList.add("hide");
    } else {
      cookiesBody.innerHTML = ""; // Clear the table if no cookies match
      noCookieRow.classList.remove("hide");
    }
  });
  // Function to add or update cookies
  cookieForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cookieName = cookieNameInput.value.trim();
    const cookieValue = cookieValueInput.value.trim();
    // const domain = document.getElementById("cookieDomain").value;
    // const path = document.getElementById("cookiePath").value;
    if (cookieName && cookieValue) {
      // Add the cookie to the current tab's domain
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        const url = new URL(tab.url);
        chrome.cookies.set(
          {
            url: url.origin, // Use the origin of the current tab
            name: cookieName,
            value: cookieValue,
          },
          (cookie) => {
            if (cookie) {
              console.log("Cookie added:", cookie);
            } else {
              console.error("Failed to add cookie");
            }
          }
        );
      });
      // Clear the inputs after adding the cookie
      cookieNameInput.value = "";
      cookieValueInput.value = "";
      validateInputs(); // Re-disable the button
    }
  });
  // Edit existing cookie by pre-filling the form
  document.addEventListener("click", async (e) => {
    // Check if the target is a <path> element inside an <svg>
    if (e.target.tagName === "path" || e.target.closest("path")) {
      // Prevent click actions on the <path> element
      e.stopPropagation(); // Prevent the event from propagating
      e.preventDefault(); // Prevent the default click action
      console.log("Click on <path> element prevented");
      return;
    }
    if (e.target.classList.contains("copy-cookie-icon")) {
      const cookieName = e.target.getAttribute("data-cookie");
      console.log("cookieName", cookieName);
      copyToClipboard(cookieName);
    }
    if (e.target.classList.contains("edit-icon")) {
      const cookieName = e.target.getAttribute("data-cookie-name");
      const rowIndex = e.target.getAttribute("data-row-index");
      console.log("cookieName to edit:", cookieName);
      // Get the specific cookie and fill the form with its data
      const cookieToEdit = await chrome.cookies.get({
        name: cookieName,
        url: tab.url,
      });
      if (cookieToEdit) {
        document.getElementById("cookieName").value = cookieToEdit.name;
        document.getElementById("cookieValue").value = cookieToEdit.value;
        topActions.classList.add("hide");
        addUpdateCTA.innerText = updateTitle;
        updateCookieWrapper.classList.remove("hide");
      }
    }
    if (e.target.classList.contains("close-copied")) {
      document.getElementById("copySuccess").classList.add("hide");
    }
    if (e.target.classList.contains("close-form")) {
      topActions.classList.remove("hide");
      updateCookieWrapper.classList.add("hide");
      content.classList.remove("hide");
    }
    if (e.target.classList.contains("addnew")) {
      topActions.classList.add("hide");
      addUpdateCTA.innerText = addTitle;
      updateCookieWrapper.classList.remove("hide");
    }
  });
  function hideCopySuccess() {
    setTimeout(function () {
      document.getElementById("copySuccess").classList.add("hide");
    }, 2000);
  }
  function copyToClipboard(text) {
    console.log("copyToClipboard", text);
    if (navigator.clipboard && window.isSecureContext) {
      // Use the modern Clipboard API for secure contexts
      return navigator.clipboard
        .writeText(text)
        .then(function () {
          console.log("Text copied to clipboard!");
          document.getElementById("copySuccess").classList.remove("hide");
          hideCopySuccess();
        })
        .catch(function (err) {
          console.error("Failed to copy: ", err);
        });
    } else {
      // Fallback for older browsers and non-secure contexts
      let textArea = document.createElement("textarea");
      textArea.value = text;
      // Avoid scrolling to bottom on iOS devices
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        console.log("Text copied to clipboard!");
        document.getElementById("copySuccess").classList.remove("hide");
        hideCopySuccess();
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
      document.body.removeChild(textArea);
    }
  }
});
