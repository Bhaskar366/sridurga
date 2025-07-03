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
  