function toggleDropdown() {
  const dropdown = document.getElementById("dropdown");
  dropdown.classList.toggle('show');
}
document.addEventListener('click', function (e) {
  const dropdown = document.getElementById("dropdown");
  const profile = document.querySelector('.profile');
  if (!profile.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

//**api's starts */
//**investmenst from */
// Function to calculate and update values
let latestData = null;

async function fetchLatestData() {
  const res = await fetch("/api/investors/last");
  latestData = await res.json();
  calculateInvestments(); // Trigger recalculation after load
}

function calculateInvestments() {
  const bhaskar = parseFloat(document.getElementById("bhaskar").value) || 0;
  const narayanarao = parseFloat(document.getElementById("narayanarao").value) || 0;
  const chandrashekhar = parseFloat(document.getElementById("chandrashekhar").value) || 0;
  const naidu = parseFloat(document.getElementById("naidu").value) || 0;
  const amountUsed = parseFloat(document.getElementById("amountUsed").value) || 0;

  const totalInvestment = bhaskar + narayanarao + chandrashekhar + naidu;
  const prevRunningTotal = parseFloat(latestData?.runningtotal) || 0;
  const prevBalance = parseFloat(latestData?.balanceamount) || 0;

  const runningTotal = prevRunningTotal + totalInvestment;
  const balanceAmount = prevBalance + totalInvestment - amountUsed;

  document.getElementById("totalInvestment").value = totalInvestment.toFixed(2);
  document.getElementById("runningTotal").value = runningTotal.toFixed(2);
  document.getElementById("balanceAmount").value = balanceAmount.toFixed(2);
}

["bhaskar", "narayanarao", "chandrashekhar", "naidu", "amountUsed"].forEach(id => {
  document.getElementById(id).addEventListener("input", calculateInvestments);
});

document.getElementById("investmentForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const bhaskar = parseFloat(document.getElementById("bhaskar").value) || 0;
  const narayanarao = parseFloat(document.getElementById("narayanarao").value) || 0;
  const chandrashekhar = parseFloat(document.getElementById("chandrashekhar").value) || 0;
  const naidu = parseFloat(document.getElementById("naidu").value) || 0;
  const amountUsed = parseFloat(document.getElementById("amountUsed").value) || 0;

  const totalInvestment = bhaskar + narayanarao + chandrashekhar + naidu;
  const prevRunningTotal = parseFloat(latestData?.runningtotal) || 0;
  const prevBalance = parseFloat(latestData?.balanceamount) || 0;

  const runningTotal = prevRunningTotal + totalInvestment;
  const balanceAmount = prevBalance + totalInvestment - amountUsed;

  const payload = {
    bhaskar,
    narayanarao,
    chandrashekhar,
    naidu,
    totalinvestment: totalInvestment,
    runningtotal: runningTotal,
    amountused: amountUsed,
    balanceamount: balanceAmount,
  };

  const response = await fetch("/api/investors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    alert("Investment submitted successfully!");
    document.getElementById("investmentForm").reset();
    await fetchLatestData(); // Refresh state
    window.location.reload();
  } else {
    alert("Error submitting investment.");
  }
});

fetchLatestData();
//**investment from */

//**get the investment data */
let currentPage = 1;

async function loadInvestorData(page = 1) {
  const res = await fetch(`/getinvestmentdata?page=${page}`);
  const { data, totalPages } = await res.json();

  const tbody = document.getElementById("investorTableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">No data found</td></tr>`;
    return;

  }

  data.forEach((item) => {
    const row = `
        <tr>
          <td>${item.investmentdate}</td>
          <td>${item.bhaskar}</td>
          <td>${item.narayanarao}</td>
          <td>${item.chandrashekhar}</td>
          <td>${item.naidu}</td>
          <td>${item.totalinvestment}</td>
          <td>${item.runningtotal}</td>
          <td>${item.amountused}</td>
          <td>${item.balanceamount}</td>
        </tr>`;
    tbody.innerHTML += row;
  });

  document.getElementById("pageIndicator").textContent = `Page ${page}`;
  document.getElementById("prevPageBtn").disabled = page === 1;
  document.getElementById("nextPageBtn").disabled = page === totalPages;

  currentPage = page;
}

// Pagination button events
document.getElementById("prevPageBtn").addEventListener("click", () => {
  if (currentPage > 1) loadInvestorData(currentPage - 1);
});

document.getElementById("nextPageBtn").addEventListener("click", () => {
  loadInvestorData(currentPage + 1);
});

// Initial load
loadInvestorData();
//**get tge investment data */

//**bhaskar total investment */
async function loadBhaskarTotal() {
  const res = await fetch("/investors/bhaskar-total");
  const data = await res.json();

  const total = parseFloat(data.totalBhaskar || 0);
  const formatted = total.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0
  });

  document.getElementById("bhaskarTotal").textContent = formatted;
}

// Call the function when page loads
loadBhaskarTotal();
//**bhaskar total investmet */

//**narayana total investment */
async function loadnarayanaraototal() {
  const res = await fetch("/investors/narayanarao-total");
  const data = await res.json();

  const total = parseFloat(data.totalnarayanarao || 0);
  const formatted = total.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0
  });

  document.getElementById("narayanaraototal").textContent = formatted;
}

// Call the function when page loads
loadnarayanaraototal();
//**narayana total investment */

//**chandrashekhar total investmnet */
async function loadchandrashekhartotal() {
  const res = await fetch("/investors/chandrashekhar-total");
  const data = await res.json();

  const total = parseFloat(data.totalchandrashekhar || 0);
  const formatted = total.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0
  });

  document.getElementById("chandrashekhartotal").textContent = formatted;
}

// Call the function when page loads
loadchandrashekhartotal();
//**chandrashekhar total investmnet */

//**naidu total investment */
async function loadnaidutotal() {
  const res = await fetch("/investors/naidu-total");
  const data = await res.json();

  const total = parseFloat(data.totalnaidu || 0);
  const formatted = total.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0
  });

  document.getElementById("naidutotal").textContent = formatted;
}

// Call the function when page loads
loadnaidutotal();
//**naidu total investment */

//**running total of investment */
async function loadrunningTotal() {
  const res = await fetch("/investors/running-total");
  const data = await res.json();

  const total = parseFloat(data.totalrunningtotal || 0);

  const formatted = total.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });

  document.getElementById("runningTotal").textContent = formatted;
}

// Call the function on page load
loadrunningTotal();
//**running total of investment */

//**balance amount on investment */
async function loadbalanceAmount() {
  const res = await fetch("/investors/balanceamount-total");
  const data = await res.json();

  const total = parseFloat(data.totalbalanceamount || 0);

  const formatted = total.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });

  document.getElementById("balanceAmount").textContent = formatted;
}

// Call the function on page load
loadbalanceAmount();
//**balance amount on investment */

//**popup modal */
let bhaskarpage = 1;

function showBhaskarDetails(page = 1) {
  bhaskarpage = page;

  fetch(`/api/bhaskar-details?page=${page}`)
    .then(res => res.json())
    .then(response => {
      const { data, totalPages } = response;
      const tbody = document.getElementById("investmentTableBody");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">No data found</td></tr>`;
        // Disable next if no more data
        document.getElementById("modalNextPageBtn").disabled = true;
      } else {
        data.forEach(row => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${row.investmentdate}</td><td>₹${row.amount}</td>`;
          tbody.appendChild(tr);
        });

        // Re-enable buttons
        document.getElementById("modalPrevPageBtn").disabled = bhaskarpage === 1;
        document.getElementById("modalNextPageBtn").disabled = bhaskarpage >= totalPages;

        // Update modal and page
        document.getElementById("investmentModal").style.display = "flex";
        document.getElementById("modalPageIndicator").textContent = `Page ${bhaskarpage}`;
      }
    })
    .catch(err => {
      alert("Error fetching Bhaskar data");
      console.error(err);
    });
}

// Modal Pagination Buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modalPrevPageBtn").addEventListener("click", () => {
    if (bhaskarpage > 1) {
      showBhaskarDetails(bhaskarpage - 1);
    }
  });

  document.getElementById("modalNextPageBtn").addEventListener("click", () => {
    showBhaskarDetails(bhaskarpage + 1);
  });
});

function closeModal() {
  document.getElementById("investmentModal").style.display = "none";
}
//**popup modal */

//**narayana popup */
let narayanapage = 1;

function shownarayanaDetails(page = 1) {
  narayanapage = page;

  fetch(`/api/narayana-details?page=${page}`)
    .then(res => res.json())
    .then(response => {
      const { data, totalPages } = response;
      const tbody = document.getElementById("narayanainvestmentTableBody");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">No data found</td></tr>`;
        // Disable next if no more data
        document.getElementById("narayanaNextPageBtn").disabled = true;
      } else {
        data.forEach(row => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${row.investmentdate}</td><td>₹${row.amount}</td>`;
          tbody.appendChild(tr);
        });

        // Re-enable buttons
        document.getElementById("narayanaPrevPageBtn").disabled = narayanapage === 1;
        document.getElementById("narayanaNextPageBtn").disabled = narayanapage >= totalPages;

        // Update modal and page
        document.getElementById("narayanainvestmentModal").style.display = "flex";
        document.getElementById("narayanaPageIndicator").textContent = `Page ${narayanapage}`;
      }
    })
    .catch(err => {
      alert("Error fetching narayana data");
      console.error(err);
    });
}

// Modal Pagination Buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("narayanaPrevPageBtn").addEventListener("click", () => {
    if (narayanapage > 1) {
      shownarayanaDetails(narayanapage - 1);
    }
  });

  document.getElementById("narayanaNextPageBtn").addEventListener("click", () => {
    shownarayanaDetails(narayanapage + 1);
  });
});

function narayanacloseModal() {
  document.getElementById("narayanainvestmentModal").style.display = "none";
}
//**narayana popup */

//**chandrashekhar popup */
let chandrashekharpage = 1;

function showchandrashekharDetails(page = 1) {
  chandrashekharpage = page;

  fetch(`/api/chandrashekhar-details?page=${page}`)
    .then(res => res.json())
    .then(response => {
      const { data, totalPages } = response;
      const tbody = document.getElementById("chandrashekarinvestmentTableBody");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">No data found</td></tr>`;
        // Disable next if no more data
        document.getElementById("chandrashekarNextPageBtn").disabled = true;
      } else {
        data.forEach(row => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${row.investmentdate}</td><td>₹${row.amount}</td>`;
          tbody.appendChild(tr);
        });

        // Re-enable buttons
        document.getElementById("chandrashekarPrevPageBtn").disabled = chandrashekharpage === 1;
        document.getElementById("chandrashekarNextPageBtn").disabled = chandrashekharpage >= totalPages;

        // Update modal and page
        document.getElementById("chandrashekarinvestmentModal").style.display = "flex";
        document.getElementById("chandrashekarPageIndicator").textContent = `Page ${chandrashekharpage}`;
      }
    })
    .catch(err => {
      alert("Error fetching chandrashekar data");
      console.error(err);
    });
}

// Modal Pagination Buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("chandrashekarPrevPageBtn").addEventListener("click", () => {
    if (chandrashekharpage > 1) {
      showchandrashekharDetails(chandrashekharpage - 1);
    }
  });

  document.getElementById("chandrashekarNextPageBtn").addEventListener("click", () => {
    showchandrashekharDetails(chandrashekharpage + 1);
  });
});

function chandrashekarcloseModal() {
  document.getElementById("chandrashekarinvestmentModal").style.display = "none";
}
//**chandrashekhar popup */