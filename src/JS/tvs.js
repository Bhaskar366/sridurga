// Toggle profile menu
document.getElementById('profileBtn').addEventListener('click', () => {
    const menu = document.getElementById('profileMenu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    menu.style.flexDirection = 'column';
  });
  
  // Product data
  const products = [
    { id: 'P005', name: 'TVS Apache', price: '₹90,000' }
    
  ];
  
  const container = document.getElementById('productContainer');
  
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p><strong>ID:</strong> ${p.id}</p>
      <p><strong>Product:</strong> ${p.name}</p>
      <p><strong>MRP:</strong> ${p.price}</p>
      <div class="add-to-cart">
        <span class="material-icons">add_shopping_cart</span> Add
      </div>
    `;
    container.appendChild(card);
  });
  
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