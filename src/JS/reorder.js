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
//**export excel of varun motors pvt lt */
let currentPage = 1;
const limit = 10;
let totalPages = 1;
let allData = [];

// Load unique supplier names into dropdown
async function loadSuppliers() {
  try {
    const res = await fetch("/api/reorder/supplier-names");
    const result = await res.json();

    if (!result.success || !result.suppliers) {
      alert("Failed to load suppliers");
      return;
    }

    const select = document.getElementById("supplierSelect");
    select.innerHTML = ""; // Clear old options

    result.suppliers.forEach(supplier => {
      const option = document.createElement("option");
      option.value = supplier;
      option.textContent = supplier;
      select.appendChild(option);
    });

    // Load data for first supplier
    loadReorderTable();
  } catch (err) {
    console.error("Error loading suppliers:", err);
    alert("Failed to fetch suppliers.");
  }
}

// Load filtered reorder data based on selected supplier
async function loadReorderTable(page = 1) {
  try {
    const supplier = document.getElementById("supplierSelect").value;
    if (!supplier) return;

    const res = await fetch(`/api/reorder?supplier=${encodeURIComponent(supplier)}`);
    const result = await res.json();

    if (!result.success || !result.data) {
      alert("No data found for this supplier.");
      return;
    }

    allData = result.data;
    totalPages = Math.ceil(allData.length / limit);
    currentPage = page;

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const pageData = allData.slice(startIndex, endIndex);

    const tbody = document.querySelector("#reorderTable tbody");
    tbody.innerHTML = "";

    pageData.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.productid}</td>
        <td>${item.productname}</td>
        <td>${item.productcompany}</td>
        <td>${item.mechanicname}</td>
        <td>${item.description}</td>
        <td>${item.qty}</td>
        <td>${item.mrp}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById("pageIndicator").textContent = `Page ${currentPage} of ${totalPages}`;
  } catch (err) {
    console.error("Load error:", err);
    alert("An error occurred while loading data.");
  }
}

document.getElementById("prevPageBtn").addEventListener("click", () => {
  if (currentPage > 1) loadReorderTable(currentPage - 1);
});

document.getElementById("nextPageBtn").addEventListener("click", () => {
  if (currentPage < totalPages) loadReorderTable(currentPage + 1);
});

async function exportToExcel() {
  try {
    const supplier = document.getElementById("supplierSelect").value;
    if (!supplier) return;

    const res = await fetch(`/api/reorder?supplier=${encodeURIComponent(supplier)}`);
    const result = await res.json();

    if (!result.success || !result.data || result.data.length === 0) {
      alert("No data to export for this supplier");
      return;
    }

    const worksheetData = result.data.map(item => ({
      "Product ID": item.productid,
      "Product Name": item.productname,
      "Product Company": item.productcompany,
      "Mechanic Name": item.mechanicname,
      "Description": item.description,
      "QTY": item.qty,
      "MRP": item.mrp
    }));


    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reorder Data");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reorder_${supplier.replace(/\s/g, "_")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Export error:", err);
    alert("An error occurred while exporting.");
  }
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadSuppliers();
});
//**export excel of varun motors pvt lt */