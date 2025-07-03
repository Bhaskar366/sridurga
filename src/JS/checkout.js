function showRegister() {
  document.getElementById('login-box').classList.add('hidden');
  document.getElementById('register-box').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('register-box').classList.add('hidden');
  document.getElementById('login-box').classList.remove('hidden');
}


//**apis start */


let checkoutCart = []; // Fetched from addcart table

document.addEventListener("DOMContentLoaded", () => {
  loadCheckoutData();
});

async function loadCheckoutData() {
  try {
    const res = await fetch("/api/get/addcart");
    const data = await res.json();
    console.log("Fetched cart data:", data);  // Added debug log
    if (data.success) {
      checkoutCart = data.cart;
      renderCheckoutTable();
    } else {
      console.error("Failed to load checkout data: ", data.message);
    }
  } catch (err) {
    console.error("Failed to load checkout data", err);
  }
}

function renderCheckoutTable() {
  const tbody = document.getElementById("checkoutTableBody");
  tbody.innerHTML = "";
  let total = 0;

  checkoutCart.forEach((item, index) => {
    const gross = item.qty * item.mrp;
    // Adjust sold amount calculation as per user: soldprice + discountamount - grossamount
    // Since soldprice is not defined before, assume soldprice = gross for calculation
    const percentAmt = 0; // initial discount amount zero
    const sold = gross + percentAmt - gross; // equals percentAmt, initially zero

    total += sold;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.productid}</td>
      <td>${item.productname}</td>
      <td>${item.mechanicname}</td>
      <td>${item.description}</td>
      <td>${item.productcompany}</td>
      <td><span class="netrate" id="netrate-${index}">${item.netrate ?? '0.00'}</span></td>
      <td><input type="number" value="${item.mrp}" class="mrp" data-index="${index}" min="0" /></td>
      <td><input type="number" value="${item.qty}" class="qty" data-index="${index}" readonly /></td>
      <td><span class="gross" id="gross-${index}">${gross.toFixed(2)}</span></td>
      <td><input type="number" class="percent" data-index="${index}" value="0" min="0" max="100" /></td>
      <td><span class="percentAmount" id="percentAmount-${index}">0.00</span></td>
      <td><span class="soldAmount" id="soldAmount-${index}">${sold.toFixed(2)}</span></td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("totalAmount").textContent = total.toFixed(2);

  document.querySelectorAll(".qty, .mrp, .percent").forEach(input => {
    input.addEventListener("input", updateCalculations);
  });
}

function updateCalculations() {
  let total = 0;

  checkoutCart.forEach((item, index) => {
    const qty = parseFloat(document.querySelector(`.qty[data-index="${index}"]`).value) || 0;
    const mrp = parseFloat(document.querySelector(`.mrp[data-index="${index}"]`).value) || 0;
    const percent = parseFloat(document.querySelector(`.percent[data-index="${index}"]`).value) || 0;

    const gross = qty * mrp;
    const percentAmt = (percent / 100) * gross;
    const sold = gross - percentAmt;

    document.getElementById(`gross-${index}`).textContent = gross.toFixed(2);
    document.getElementById(`percentAmount-${index}`).textContent = percentAmt.toFixed(2);
    document.getElementById(`soldAmount-${index}`).textContent = sold.toFixed(2);

    total += sold;

    // Store updated values
    checkoutCart[index].qty = qty;
    checkoutCart[index].mrp = mrp;
    checkoutCart[index].grossamount = gross;
    checkoutCart[index].percentage = percent;
    checkoutCart[index].percentageamount = percentAmt;
    checkoutCart[index].soldprice = sold;
  });

  document.getElementById("totalAmount").textContent = total.toFixed(2);
}

async function placeOrder() {
  try {
    const res = await fetch("/api/placeorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: checkoutCart })
    });

    const data = await res.json();

    if (data.success) {
      alert("Order placed successfully!");
      window.location.href = "./myorder.html";
    } else {
      alert("Order failed: " + data.message);
    }
  } catch (err) {
    console.error("Order error", err);
    alert("Failed to place order.");
  }
}
