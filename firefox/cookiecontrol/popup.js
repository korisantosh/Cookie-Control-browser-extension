document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let cookies = await browser.cookies.getAll({ url: tab.url });
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
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    cookies = await browser.cookies.getAll({ url: tab.url });
    renderCookies(cookies);
  }

  // Function to render the cookies in the table
  function renderCookies(cookiesList) {
    cookiesList.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    cookiesBody.innerHTML = "";
    if (cookiesList.length > 0) {
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
    const hasValue =
      searchTerm.trim().length > 0
        ? searchInput.classList.add("has-value")
        : searchInput.classList.remove("has-value");
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
    if (cookieName && cookieValue) {
      // Add the cookie to the current tab's domain
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = new URL(tab.url);
      try {
        await browser.cookies.set({
          url: url.origin, // Use the origin of the current tab
          name: cookieName,
          value: cookieValue,
        });
        console.log("Cookie added:", { cookieName, cookieValue });
        showToastMessage(`Cookie "${cookieName}" added.`);
        content.classList.remove("hide");
        document.body.classList.remove("no-cookies");
        topActions.classList.remove("hide");
        updateCookieWrapper.classList.add("hide");
        document.body.classList.remove("add-cookie");
        getAllCookies();
      } catch (error) {
        console.error("Failed to add cookie", error);
      }
      // Clear the inputs after adding the cookie
      cookieNameInput.value = "";
      cookieValueInput.value = "";
      validateInputs(); // Re-disable the button
    }
  });

  // Edit existing cookie by pre-filling the form
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-copy")) {
      const cookieName = e.target.getAttribute("data-cookie-name");
      copyToClipboard(cookieName);
    }
    if (e.target.classList.contains("edit-icon")) {
      const cookieName = e.target.getAttribute("data-cookie-name");
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const cookieToEdit = await browser.cookies.get({
        name: cookieName,
        url: tab.url,
      });
      if (cookieToEdit) {
        cookieNameInput.value = cookieToEdit.name;
        cookieValueInput.value = cookieToEdit.value;
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
      document.body.classList.remove("all-deleted");
      document.body.classList.add("add-cookie");
      addUpdateCTA.innerText = addTitle;
      updateCookieWrapper.classList.remove("hide");
    }
    if (e.target.classList.contains("btn-delete")) {
      const cookieName = e.target.getAttribute("data-cookie-name");
      deleteCookie(cookieName);
    }
    if (e.target.classList.contains("icon-delete-all")) {
      deleteAllCookies();
      document.body.classList.add("all-deleted");
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
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () {
        showToastMessage(textCopied);
      });
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToastMessage(textCopied);
    }
  }

  // Function to delete a specific cookie
  async function deleteCookie(cookieName) {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab.url;
    const targetCookie = await browser.cookies.get({ url, name: cookieName });
    if (targetCookie) {
      await browser.cookies.remove({
        url: `http${targetCookie.secure ? "s" : ""}://${targetCookie.domain}${
          targetCookie.path
        }`,
        name: cookieName,
      });
      showToastMessage(`Cookie "${cookieName}" deleted.`);
      getAllCookies();
    }
  }

  // Function to delete all cookies for the current tab's domain
  async function deleteAllCookies() {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const cookies = await browser.cookies.getAll({ url: tab.url });
    for (const cookie of cookies) {
      await browser.cookies.remove({
        url: `http${cookie.secure ? "s" : ""}://${cookie.domain}${cookie.path}`,
        name: cookie.name,
      });
    }
    showToastMessage("All cookies deleted!");
    getAllCookies();
  }
});
