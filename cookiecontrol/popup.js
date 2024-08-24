document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const cookieList = document.getElementById("cookieList");
  const cookiesBody = document.getElementById("cookiesBody");

  searchInput.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase();
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.tabs
        .sendMessage(tabs[0].id, { action: "getCookies" })
        .then((cookies) => {
          cookiesBody.innerHTML = "";
          cookies.forEach((cookie) => {
            if (cookie.name.toLowerCase().includes(searchTerm)) {
              const row = document.createElement("tr");
              row.innerHTML = `
                  <td id="row-${index}"><div class="cookie-item"><span title="${cookie.name}" class="text-ellipsis">${cookie.name}</span><span class="action-ctas"><button title="Copy Name" class="btn-copy" data-cookie-name="${cookie.name}"></button></span></div></div></td>
                  <td class="cookie-value"><div class="cookie-item"><span title="${cookie.value}" class="text-ellipsis">${cookie.value}</span><span class="action-ctas"><button title="Copy Value" class="btn-copy" data-cookie-name="${cookie.value}"></button><button class="edit-icon icon-edit" title="Edit Cookie" data-row-index="row-${index}" data-cookie-name="${cookie.name}" data-cookie-value="${cookie.value}"></button><button class="btn-delete"  title="Delete Cookie" data-cookie-name="${cookie.name}" data-row-index="row-${index}"></button></span></div></td>
                `;
                cookiesBody.appendChild(row);
            }
          });
        });
    });
  });
  // Get the current tab
  function getAllCookies() {
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      const tab = tabs[0];
      const url = tab.url;
      // Get cookies for the current tab
      browser.cookies.getAll({url}).then(cookies => {
        console.log(cookies);
        debugger;
        cookies.forEach((cookie, index ) => {
          console.log(cookie);
          const row = document.createElement('tr');
          row.innerHTML = `
              <td id="row-${index}"><div class="cookie-item"><span title="${cookie.name}" class="text-ellipsis">${cookie.name}</span><span class="action-ctas"><button title="Copy Name" class="btn-copy" data-cookie-name="${cookie.name}"></button></span></div></div></td>
              <td class="cookie-value"><div class="cookie-item"><span title="${cookie.value}" class="text-ellipsis">${cookie.value}</span><span class="action-ctas"><button title="Copy Value" class="btn-copy" data-cookie-name="${cookie.value}"></button><button class="edit-icon icon-edit" title="Edit Cookie" data-row-index="row-${index}" data-cookie-name="${cookie.name}" data-cookie-value="${cookie.value}"></button><button class="btn-delete"  title="Delete Cookie" data-cookie-name="${cookie.name}" data-row-index="row-${index}"></button></span></div></td>
            `;
          cookiesBody.appendChild(row);
        });
      });
    });
  }

  getAllCookies();
});
