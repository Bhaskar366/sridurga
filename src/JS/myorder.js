function showRegister() {
  document.getElementById('login-box').classList.add('hidden');
  document.getElementById('register-box').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('register-box').classList.add('hidden');
  document.getElementById('login-box').classList.remove('hidden');
}

//**apis start */
//**get the data from the database of orders */
let currentOffset = 0;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");
  loadDayOrders();

  const prevBtn = document.getElementById("prevDayBtn");
  const nextBtn = document.getElementById("nextDayBtn");

  console.log("Prev button element:", prevBtn);
  console.log("Next button element:", nextBtn);

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      console.log("Prev button clicked");
      currentOffset++;
      loadDayOrders();
    });
  } else {
    console.error("Prev button not found");
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      console.log("Next button clicked");
      if (currentOffset > 0) {
        currentOffset--;
        loadDayOrders();
      }
    });
  } else {
    console.error("Next button not found");
  }
});

function getDateByOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return date.toISOString().split('T')[0];
}

async function loadDayOrders() {
  const dateStr = getDateByOffset(currentOffset);
  try {
    const res = await fetch(`/api/checkout-by-date?date=${dateStr}`);
    if (!res.ok) throw new Error("Failed to fetch data");

    const data = await res.json();

    const formattedDate = new Date(dateStr).toLocaleDateString('en-IN');
    document.getElementById("dateHeading").textContent = `Orders for ${formattedDate}`;
    document.getElementById("pageDate").textContent = `${formattedDate} Total Sold Price`;


    const tbody = document.getElementById("checkoutTableBody");
    tbody.innerHTML = "";

    if (!data.orders || data.orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;">No records</td></tr>`;
    } else {
      data.orders.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${r.orderdate}</td>
                    <td>${r.productid}</td>
                    <td>${r.productname}</td>
                    <td>${r.mechanicname}</td>
                    <td>${r.description}</td>
                    <td>${r.productcompany}</td>
                    <td>${r.qty}</td>
                    <td>${r.mrp}</td>
                    <td>${r.percentage}</td>
                    <td>${r.percentageamount}</td>
                    <td>${r.grossamount}</td>
                    <td><button class="delete-btn" data-id="${r.productid}" data-date="${r.orderdate}">Delete</button></td>
                `;
        tbody.appendChild(tr);

        // Attach delete event listener to the button
        tr.querySelector(".delete-btn").addEventListener("click", async (e) => {
          const productid = e.target.dataset.id;
          const orderdate = e.target.dataset.date;

          // Get qty from current row
          const qtyCell = tr.children[6]; // assuming QTY is 7th column (index 6)
          const currentQty = parseInt(qtyCell.textContent);

          let deleteQty = 1;

          if (currentQty > 1) {
            const input = prompt(`This order has ${currentQty} units.\nHow many do you want to delete?`, "1");
            if (input === null) return; // Cancelled

            deleteQty = parseInt(input);
            if (isNaN(deleteQty) || deleteQty <= 0 || deleteQty > currentQty) {
              alert(`❌ Please enter a number between 1 and ${currentQty}`);
              return;
            }
          }

          const confirmed = confirm(`Are you sure you want to delete ${deleteQty} unit(s) of Product ID ${productid}?`);
          if (!confirmed) return;

          try {
            const res = await fetch(`/api/delete-order`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productid, orderdate, deleteQty }),
            });

            const result = await res.json();
            if (res.ok && result.success) {
              alert("Deleted successfully");
              loadDayOrders();
            } else {
              alert("Delete failed: " + (result.message || "Unknown error"));
            }
          } catch (err) {
            console.error("Delete error:", err);
            alert("Error deleting entry.");
          }
        });

      });
    }

    document.getElementById("dayTotal").textContent = `₹${data.total ?? 0}`;

    // Disable Next if offset is 0 (today)
    document.getElementById("nextDayBtn").disabled = currentOffset === 0;
    // Enable Prev always (or add max offset limit if needed)
    document.getElementById("prevDayBtn").disabled = false;

  } catch (error) {
    console.error("Error fetching orders:", error);
    alert("Could not load orders. Please try again.");
  }
}

//**delete query */


//**deelete query */

//**month orders */
let currentBatchOffset = 0;
let expandedMonth = null;

document.addEventListener("DOMContentLoaded", () => {
  loadMonths();

  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentBatchOffset += 5;
    expandedMonth = null; // Reset view
    loadMonths();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentBatchOffset = Math.max(0, currentBatchOffset - 5);
    expandedMonth = null; // Reset view
    loadMonths();
  });
});

async function loadMonths() {
  try {
    const response = await fetch(`/api/months-summary?offset=${currentBatchOffset}&limit=5`);
    if (!response.ok) throw new Error("Failed to fetch months summary");

    const { months, totalCount } = await response.json();

    document.getElementById("currentRange").textContent =
      `Showing ${currentBatchOffset + 1} - ${Math.min(currentBatchOffset + 5, totalCount)} of ${totalCount} months`;

    const tbody = document.getElementById("monthListBody");
    tbody.innerHTML = "";

    if (!months.length) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No records available</td></tr>`;
    } else {
      months.forEach(({ monthName, year, total, monthStr }) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${monthName} ${year}</td>
          <td>₹${total || 0}</td>
          <td><button class="expand-month" data-month="${monthStr}" data-label="${monthName} ${year}">🔍 View Orders</button></td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Attach view buttons
    document.querySelectorAll(".expand-month").forEach(button => {
      button.addEventListener("click", () => {
        const selectedMonth = button.getAttribute("data-month");
        const label = button.getAttribute("data-label");

        if (expandedMonth === selectedMonth) {
          // Collapse
          expandedMonth = null;
          document.getElementById("fullMonthOrdersSection").style.display = "none";
        } else {
          expandedMonth = selectedMonth;
          loadFullMonthOrders(selectedMonth, label);
        }
      });
    });

  } catch (error) {
    console.error("loadMonths error:", error);
    alert("Error loading months. Please try again.");
  }
}

async function loadFullMonthOrders(month, label) {
  try {
    const res = await fetch(`/api/full-month-orders?month=${month}`);
    if (!res.ok) throw new Error("Failed to fetch full month orders");

    const { orders } = await res.json();

    const section = document.getElementById("fullMonthOrdersSection");
    const title = document.getElementById("selectedMonthTitle");
    const tbody = document.getElementById("fullMonthOrdersBody");

    title.textContent = `Orders for ${label}`;
    tbody.innerHTML = "";

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;">No orders for this month</td></tr>`;
    } else {
      orders.forEach(order => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${order.orderdate}</td>
          <td>${order.productid}</td>
          <td>${order.productname}</td>
          <td>${order.mechanicname}</td>
          <td>${order.description}</td>
          <td>${order.productcompany}</td>
          <td>${order.qty}</td>
          <td>${order.mrp}</td>
          <td>${order.percentage}</td>
          <td>${order.percentageamount}</td>
          <td>${order.soldprice}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    section.style.display = "block";

  } catch (err) {
    console.error("loadFullMonthOrders error:", err);
    alert("Could not load full month orders. Please try again.");
  }
}

//**month orders */