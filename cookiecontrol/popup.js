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
  const textCopied = "Copied!";
  const updateCookieWrapper = document.getElementById("updateCookieWrapper");
  const content = document.getElementById("content");
  const noCookieRow = document.getElementById("noCookieRow");
  const noCookiesFound = document.getElementById("noCookies");
  const topActions = document.getElementById("topActions");
  const addUpdateCTA = document.getElementById("addUpdateCTA");
  const searchInput = document.getElementById("searchInput");
  const toastMessage = document.getElementById("toastMessage");
  // Enable button when both fields have values
  const validateInputs = () => {
    const isCookieNameFilled = cookieNameInput.value.trim() !== "";
    const isCookieValueFilled = cookieValueInput.value.trim() !== "";
    addCookieButton.disabled = !(isCookieNameFilled && isCookieValueFilled);
  };
  // Listen for input changes on both fields
  cookieNameInput.addEventListener("input", validateInputs);
  cookieValueInput.addEventListener("input", validateInputs);

  async function getAllCookies() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const cookies = await chrome.cookies.getAll({ url: tab.url });
    renderCookies(cookies);
  }
  // Function to render the cookies in the table
  function renderCookies(cookiesList) {
    cookiesBody.innerHTML = "";
    if(cookiesList.length > 0) {
      document.body.classList.remove("no-cookies");
      cookiesList.forEach((cookie, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td id="row-${index}"><div class="cookie-item"><span title="${cookie.name}" class="text-ellipsis">${cookie.name}</span><span class="action-ctas"><button title="Copy Name" class="btn-copy" data-cookie-name="${cookie.name}"></button></span></div></div></td>
            <td class="cookie-value"><div class="cookie-item"><span title="${cookie.value}" class="text-ellipsis">${cookie.value}</span><span class="action-ctas"><button title="Copy Value" class="btn-copy" data-cookie-name="${cookie.value}"></button><button class="edit-icon icon-edit" title="Edit Cookie" data-row-index="row-${index}" data-cookie-name="${cookie.name}" data-cookie-value="${cookie.value}"></button><button class="btn-delete"  title="Delete Cookie" data-cookie-name="${cookie.name}" data-row-index="row-${index}"></button></span></div></td>
          `;
        cookiesBody.appendChild(row);
      });
    } else {
      document.body.classList.add("no-cookies");
    }
  }
  // Initial rendering of all cookies
  getAllCookies();
  // Search filter logic
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const hasValue = (searchTerm.trim().length > 0) ? searchInput.classList.add("has-value") : searchInput.classList.remove("has-value");
    const filteredCookies = cookies.filter((cookie) =>
      cookie.name.toLowerCase().includes(searchTerm)
    );
    if (filteredCookies.length > 0) {
      document.body.classList.remove("no-cookies");
      renderCookies(filteredCookies);
      noCookieRow.classList.add("hide");
    } else {
      cookiesBody.innerHTML = ""; // Clear the table if no cookies match
      noCookieRow.classList.remove("hide");
      document.body.classList.add("no-cookies");
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
              showToastMessage(`Cookie "${cookieName}" added.`);
              content.classList.remove("hide");
              document.body.classList.remove("no-cookies");
              topActions.classList.remove("hide");
              updateCookieWrapper.classList.add("hide");
              document.body.classList.remove("add-cookie");
              getAllCookies();
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
    if (e.target.classList.contains("btn-copy")) {
      const cookieName = e.target.getAttribute("data-cookie-name");
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
      document.body.classList.remove("add-cookie");
    }
    if (e.target.classList.contains("addnew")) {
      document.body.classList.add("add-cookie");
      addUpdateCTA.innerText = addTitle;
      updateCookieWrapper.classList.remove("hide");
    }
    if (e.target.classList.contains("btn-delete")) {
      const cookieName = e.target.getAttribute("data-cookie-name");
      const rowIndex = e.target.getAttribute("data-row-index");
      deleteCookie(cookieName, rowIndex);
    }
    if (e.target.classList.contains("icon-delete-all")) {
      deleteAllCookies();
    }
  });
  function showToastMessage(msg) {
    toastMessage.innerText = msg;
    document.getElementById("copySuccess").classList.remove("hide");
    hideCopySuccess();
  }
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
          showToastMessage(textCopied);
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
        showToastMessage(textCopied);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
      document.body.removeChild(textArea);
    }
  }
  // Function to delete a specific cookie and remove the corresponding row
function deleteCookie(cookieName, rowID) {
  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTab = tabs[0];
    const tabUrl = activeTab.url;

    // Get all cookies for the active tab's URL
    chrome.cookies.getAll({ url: tabUrl }, function(cookies) {
    // Log all cookies for debugging
    console.log("Cookies found:", cookies);
    // Find the cookie by name
    const targetCookie = cookies.find(cookie => cookie.name === cookieName);

    if (targetCookie) {
      // Construct the cookie URL
      const cookieUrl = "http" + (targetCookie.secure ? "s" : "") + "://" + targetCookie.domain + targetCookie.path;

      // Delete the cookie using chrome.cookies.remove
      chrome.cookies.remove({
        url: cookieUrl,
        name: targetCookie.name
      }, () => {
        // Check if the cookie was successfully deleted
        if (chrome.runtime.lastError) {
          showToastMessage(`Error deleting cookie: ${chrome.runtime.lastError}`);
          console.error(`Error deleting cookie: ${chrome.runtime.lastError}`);
        } else {
          // Remove the corresponding row from the table
          const rowElement = document.getElementById(rowID);
          if (rowElement) {
            rowElement.remove();
            console.log(`Cookie "${cookieName}" deleted and row "${rowID}" removed.`);
            showToastMessage(`Cookie "${cookieName}" deleted.`);
            hideCopySuccess();
          }
        }
      });
    } else {
      console.log(`Cookie "${cookieName}" not found.`);
    }
  });
  });
}
  // Function to delete all cookies for the current tab's domain
function deleteAllCookies() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTab = tabs[0];
    const tabUrl = activeTab.url;
    chrome.cookies.getAll({ url: tabUrl }, function(cookies) {
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        // Construct the cookie URL from its domain
        var cookieUrl = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
        // Remove the cookie by name
        chrome.cookies.remove({
          url: cookieUrl,
          name: cookie.name
        });
      }
      // Notify user that cookies have been deleted
      while (cookiesBody.firstChild) {
        cookiesBody.removeChild(cookiesBody.firstChild);
      }
      console.log('All cookies deleted for the current domain.');
      showToastMessage(`All cookies deleted for the current domain.`);
      document.body.classList.add("no-cookies");
    });
  });
}
});
