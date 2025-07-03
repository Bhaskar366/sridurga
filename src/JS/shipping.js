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

//**inset the info to database */
// ✅ Blur event for autofill — placed outside the submit listener
document.getElementById("productid").addEventListener("blur", async function () {
  const productid = this.value.trim();
  if (!productid) return;

  try {
    const res = await fetch(`/data/products/${productid}`);
    if (!res.ok) throw new Error("Product not found");

    const product = await res.json();

    // Fill all fields except QTY
    document.getElementById("productname").value = product.productname || "";
    document.getElementById("mechanicname").value = product.mechanicname || "";
    document.getElementById("suppliername").value = product.suppliername || "";
    document.getElementById("description").value = product.description || "";
    document.getElementById("productcompany").value = product.productcompany || "";
    document.getElementById("netrate").value = product.netrate || "";
    document.getElementById("mrp").value = product.mrp || "";
  } catch (err) {
    console.warn("No existing product found or fetch failed.");
    // Optional: clear other fields
    document.getElementById("productname").value = "";
    document.getElementById("mechanicname").value = "";
    document.getElementById("suppliername").value = "";
    document.getElementById("description").value = "";
    document.getElementById("productcompany").value = "";
    document.getElementById("netrate").value = "";
    document.getElementById("mrp").value = "";
  }
});

// ✅ Submit handler
document.getElementById("productForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    productid: document.getElementById("productid").value.trim(),
    productname: document.getElementById("productname").value.trim(),
    mechanicname: document.getElementById("mechanicname").value.trim(),
    suppliername: document.getElementById("suppliername").value.trim(),
    description: document.getElementById("description").value.trim(),
    productcompany: document.getElementById("productcompany").value.trim(),
    netrate: parseFloat(document.getElementById("netrate").value) || 0,
    mrp: parseFloat(document.getElementById("mrp").value) || 0,
    qty: parseInt(document.getElementById("qty").value) || 0,
  };

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok) {
      alert(result.message || "Product saved successfully!");
      this.reset(); // clear form
    } else {
      alert(result.error || "Submit failed.");
    }
  } catch (err) {
    console.error("Submit error:", err);
    alert("Error submitting form.");
  }
});

//**inset the info to database */

//**fetch the data altest 10 recodes */
let currentPage = 1;
const limit = 10;

async function fetchProducts(page) {
  const res = await fetch(`/get/products?page=${page}&limit=${limit}`);
  const data = await res.json();

  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";

  data.products.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.entrydate}</td>
      <td>${row.productid}</td>
      <td>${row.productname}</td>
      <td>${row.mechanicname}</td>
       <td>${row.suppliername}</td>
      <td>${row.description}</td>
      <td>${row.productcompany}</td>
      <td>${row.netrate}</td>
      <td>${row.qty}</td>
      <td>${row.mrp}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("pageIndicator").textContent = `Page ${currentPage}`;
}

document.getElementById("prevPageBtn").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    fetchProducts(currentPage);
  }
});

document.getElementById("nextPageBtn").addEventListener("click", () => {
  currentPage++;
  fetchProducts(currentPage);
});

// Initial fetch
fetchProducts(currentPage);
//**fetch the data altest 10 recodes */
