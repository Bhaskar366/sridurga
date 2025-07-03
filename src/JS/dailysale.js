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

//**apis start */
//**profit cal */
let currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  loadProfitData();

  document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadProfitData();
    }
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    currentPage++;
    loadProfitData();
  });
});

async function loadProfitData() {
  try {
    const res = await fetch(`/api/dailyprofit?page=${currentPage}`);
    const data = await res.json();

    const tbody = document.getElementById("profitTableBody");
    tbody.innerHTML = "";

    if (!data.success || !Array.isArray(data.records)) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Unexpected data format</td></tr>`;
      return;
    }

    if (data.records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">No data found</td></tr>`;
      if (currentPage > 1) currentPage--; // stay on last available page
      return;
    }

    document.getElementById("pageInfo").textContent = `Page: ${currentPage}`;

    data.records.forEach(row => {
      const tr = document.createElement("tr");
      const profitColor = parseFloat(row.profit) >= 0 ? "green" : "red";
      tr.innerHTML = `
        <td>${row.orderdate}</td>
        <td>${row.productid}</td>
        <td>${row.productname}</td>
        <td>${row.mechanicname}</td>
        <td>${row.description}</td>
        <td>${row.productcompany}</td>
        <td>${parseFloat(row.netrate).toFixed(2)}</td>
        <td>${row.qty}</td>
        <td>${parseFloat(row.soldprice).toFixed(2)}</td>
        <td style="color:${profitColor}">${parseFloat(row.profit).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error loading profit data:", err);
    document.getElementById("profitTableBody").innerHTML =
      `<tr><td colspan="10" style="color:red;text-align:center;">${err.message}</td></tr>`;
  }
}
//**profit cal */

//**daily total sale value */
async function loadDailySummary() {
  try {
    const res = await fetch("/api/orders/summary");
    const data = await res.json();

    if (data.success) {
      document.getElementById("latestDate").textContent = data.latestDate;
      document.getElementById("totalProducts").textContent = data.totalQty;
      document.getElementById("totalSold").textContent = parseFloat(data.totalSold).toFixed(2);
    } else {
      console.error("Failed to load summary");
    }
  } catch (err) {
    console.error("Error fetching daily summary:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadDailySummary);
//**daily total sale value */

//**total sale value of this month */
document.addEventListener("DOMContentLoaded", () => {
  loadMonthlySummary();
});

async function loadMonthlySummary() {
  try {
    const res = await fetch("/api/orders/monthly-summary");
    const data = await res.json();

    if (data.success) {
      const now = new Date();
      const monthName = now.toLocaleString('default', { month: 'long' });
      const year = now.getFullYear();

      document.getElementById("monthTitle").textContent = `Month: ${monthName} ${year}`;
      document.getElementById("monthlyProducts").textContent = data.totalQty || 0;
      document.getElementById("monthlySales").textContent = parseFloat(data.totalSold).toFixed(2);
    } else {
      console.error("Failed to load monthly summary");
    }
  } catch (err) {
    console.error("Error fetching monthly summary:", err);
  }
}
//**total sale value of this month */

//**today today profit */
document.addEventListener("DOMContentLoaded", () => {
  loadTodayProfit();
});

async function loadTodayProfit() {
  try {
    const res = await fetch("/api/orders/today-profit");
    const data = await res.json();

    if (data.success) {
      document.getElementById("totalProfitToday").textContent = parseFloat(data.totalProfit).toFixed(2);
    } else {
      console.error("Failed to load today’s profit");
    }
  } catch (err) {
    console.error("Error fetching today’s profit:", err);
  }
}

//**today total profit */

//**this month total profit */
document.addEventListener("DOMContentLoaded", () => {
  loadMonthlyProfit();
});

async function loadMonthlyProfit() {
  try {
    const res = await fetch("/api/orders/monthly-profit");
    const data = await res.json();

    if (data.success) {
      const monthName = new Date().toLocaleString("default", { month: "long" });
      const year = new Date().getFullYear();

      document.getElementById("monthLabel").textContent = `${monthName} ${year}`;
      document.getElementById("totalMonthlyProfit").textContent = parseFloat(data.totalProfit).toFixed(2);
    } else {
      console.error("Failed to load monthly profit");
    }
  } catch (err) {
    console.error("Error fetching monthly profit:", err);
  }
}

//**this month total profit */