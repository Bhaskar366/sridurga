// Toggle profile menu
document.getElementById('profileBtn').addEventListener('click', () => {
    const menu = document.getElementById('profileMenu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    menu.style.flexDirection = 'column';
  });
  
  /* Removed unused product cards code that appended to non-existent 'productContainer' */
  
  // Toggle Companies dropdown on button click
  const companiesBtn = document.getElementById('companiesBtn');
  const companiesMenu = document.getElementById('companiesMenu');
  
  companiesBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent body click from firing immediately
    companiesMenu.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.body.addEventListener('click', () => {
    companiesMenu.classList.remove('show');
  });
  
  //**apis start */
  
  //**fetch products list */
  let cart = [];
  let currentPage = 1;
  const limit = 10;
  let searchQuery = "";
  
  document.addEventListener("DOMContentLoaded", () => {
    loadProducts(currentPage, searchQuery);
  
    document.getElementById("prevPageBtn").addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadProducts(currentPage, searchQuery);
      }
    });
  
    document.getElementById("nextPageBtn").addEventListener("click", () => {
      currentPage++;
      loadProducts(currentPage, searchQuery);
    });
  
    document.getElementById("searchBar").addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      currentPage = 1;
      loadProducts(currentPage, searchQuery);
    });
  
    updateCartCount();
  });
  
  async function loadProducts(page, search) {
    try {
      const res = await fetch(`/api/get/productsdata?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
  
      const tbody = document.getElementById("productTableBody");
      tbody.innerHTML = "";
  
      if (!data.products || data.products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No products found</td></tr>`;
        return;
      }
  
      data.products.forEach((product) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${product.productid}</td>
          <td>${product.productname}</td>
          <td>${product.mechanicname}</td>
          <td>${product.description}</td>
          <td>${product.productcompany}</td>
          <td>${product.qty}</td>
          <td>${product.mrp}</td>
          <td>
            <button type="button" class="cart-button" onclick="addToCart('${product.productid}')">
              <span class="material-icons" style="color: #800000;">shopping_cart</span>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
  
      document.getElementById("pageIndicator").textContent = `Page ${page}`;
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }
  
  let addToCartInProgress = false;
  
  async function addToCart(productid) {
    if (addToCartInProgress) return;
    addToCartInProgress = true;
  
    const row = [...document.querySelectorAll('#productTableBody tr')]
      .find(tr => tr.children[0].textContent === productid);
  
    if (!row) {
      alert('Product not found.');
      addToCartInProgress = false;
      return;
    }
  
    const availableQty = parseInt(row.children[5].textContent, 10); // from product table
    if (availableQty === 0) {
      alert("We can't add to the cart. The product quantity is sold out. Please add quantity to proceed.");
      addToCartInProgress = false;
      return;
    }
  
    // Fetch current cart to count how many of this product are already in cart
    let currentQtyInCart = 0;
    try {
      const res = await fetch('/addcart');
      const data = await res.json();
      if (data.success && data.cart) {
        const found = data.cart.find(item => item.productid === productid);
        currentQtyInCart = found ? found.qty : 0;
      }
    } catch (err) {
      console.error('Error checking current cart quantity:', err);
    }
  
    if (currentQtyInCart >= availableQty) {
      alert(`Cannot add more. Already added maximum allowed quantity (${availableQty}) for this product.`);
      addToCartInProgress = false;
      return;
    }
  
    const product = {
      productid,
      productname: row.children[1].textContent,
      mechanicname: row.children[2].textContent,
      description: row.children[3].textContent,
      productcompany: row.children[4].textContent,
      qty: 1,
      mrp: parseFloat(row.children[6].textContent) || 0
    };
  
    try {
      const res = await fetch('/api/post/addcart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: [product] })
      });
  
      const data = await res.json();
      if (!data.success) alert('Failed to add to cart: ' + data.message);
      else updateCartCount();
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  
    addToCartInProgress = false;
  }
  
  
  async function updateCartCount() {
    try {
      const res = await fetch('/addcart');
      const data = await res.json();
      const cartCount = document.getElementById('cartCount');
  
      if (data.success && data.cart) {
        const totalQty = data.cart.reduce((sum, p) => sum + (p.qty || 0), 0);
        cartCount.textContent = totalQty;
        cartCount.style.display = totalQty > 0 ? 'inline-block' : 'none';
      } else {
        cartCount.style.display = 'none';
      }
    } catch (err) {
      console.error('Error updating cart count:', err);
    }
  }
  
  window.addToCart = addToCart;
  
  //**popup modal */
  document.getElementById("cartIcon").addEventListener("click", showCartPopup);
  
  function showCartPopup() {
    fetch('/api/get/addcart')
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById("cartItemsList");
        list.innerHTML = "";
  
        if (!data.success || data.cart.length === 0) {
          list.innerHTML = "<li>No items in cart</li>";
        } else {
          data.cart.forEach(item => {
            const li = document.createElement("li");
            li.style.marginBottom = "8px";
            li.innerHTML = `
              <strong>${item.productid}</strong> - ${item.productname}<br>
              Quantity: ${item.qty}
            `;
            list.appendChild(li);
          });
        }
  
        document.getElementById("cartPopup").style.display = "block";
      })
      .catch(err => {
        console.error("Failed to fetch cart items:", err);
      });
  }
  
  function closeCartPopup() {
    document.getElementById("cartPopup").style.display = "none";
  }
  
  function checkoutCart() {
    window.location.href = "../PAGES/checkout.html";
  }
  
  function clearCart() {
    if (!confirm("Are you sure you want to clear the cart?")) return;
  
    fetch('/api/clear/addcart', {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Cart cleared!");
          closeCartPopup();
          updateCartCount(); // Refresh count
        } else {
          alert("Failed to clear cart.");
        }
      })
      .catch(err => {
        console.error("Clear cart failed:", err);
      });
  }
  
  //**popup modal */

