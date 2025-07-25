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

document.getElementById("purchaseForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const supplierName = document.getElementById("supplierName").value.trim();
    const purchasedAmount = parseFloat(document.getElementById("purchasedAmount").value);

    if (!supplierName || isNaN(purchasedAmount)) {
        alert("Please fill all fields correctly.");
        return;
    }

    try {
        const res = await fetch("/add-purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ supplierName, purchasedAmount })
        });

        const result = await res.json();
        if (result.success) {
            loadPurchases(); // Refresh the table
            document.getElementById("purchaseForm").reset();
        } else {
            alert("Error saving purchase");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

async function loadPurchases() {
    const res = await fetch("/get-purchases");
    const data = await res.json();

    const tbody = document.getElementById("purchaseTableBody");
    tbody.innerHTML = "";
    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.suppliername}</td>
            <td>${item.purchasedamount}</td>
        `;
        tbody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", loadPurchases);
