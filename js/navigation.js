function setupNavigation() {
  // Add navigation button to all pages except login/register
  if (!window.location.pathname.includes('index.html') && 
      !window.location.pathname.includes('register.html')) {
    createNavButton();
  }
}

function createNavButton() {
  const navBtn = document.createElement('button');
  navBtn.id = 'nav-toggle';
  navBtn.innerHTML = '☰ Menu';
  navBtn.style.position = 'fixed';
  navBtn.style.top = '20px';
  navBtn.style.right = '20px';
  navBtn.style.zIndex = '1000';
  navBtn.style.padding = '10px 15px';
  navBtn.style.borderRadius = '5px';
  navBtn.style.backgroundColor = '#ff8c42';
  navBtn.style.color = 'white';
  navBtn.style.border = 'none';
  navBtn.style.cursor = 'pointer';
  
  document.body.appendChild(navBtn);

  const navMenu = document.createElement('div');
  navMenu.id = 'nav-menu';
  navMenu.style.display = 'none';
  navMenu.style.position = 'fixed';
  navMenu.style.top = '60px';
  navMenu.style.right = '20px';
  navMenu.style.backgroundColor = 'white';
  navMenu.style.padding = '15px';
  navMenu.style.borderRadius = '12px';
  navMenu.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
  navMenu.style.zIndex = '999';
  
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  let menuItems = [];
  if (user.role === 'customer') {
    menuItems = [
      { text: 'Home', href: 'customer.html' },
      { text: 'My Orders', href: 'customer.html#orders' },
      { text: 'Logout', action: 'logout' }
    ];
  } else if (user.role === 'owner') {
    menuItems = [
      { text: 'Dashboard', href: 'owner.html' },
      { text: 'Logout', action: 'logout' }
    ];
  } else if (user.role === 'admin') {
    menuItems = [
      { text: 'Pending Approvals', href: 'admin.html#approvals' },
      { text: 'Approval History', href: 'admin.html#history' },
      { text: 'Logout', action: 'logout' }
    ];
  }

  menuItems.forEach(item => {
    const link = document.createElement('a');
    if (item.href) {
      link.href = item.href;
      link.textContent = item.text;
      link.style.display = 'block';
      link.style.padding = '8px 0';
      link.style.color = '#333';
      link.style.textDecoration = 'none';
    } else if (item.action === 'logout') {
      link.textContent = item.text;
      link.style.display = 'block';
      link.style.padding = '8px 0';
      link.style.color = '#333';
      link.style.textDecoration = 'none';
      link.style.cursor = 'pointer';
      link.addEventListener('click', logout);
    }
    navMenu.appendChild(link);
  });

  document.body.appendChild(navMenu);

  navBtn.addEventListener('click', () => {
    navMenu.style.display = navMenu.style.display === 'none' ? 'block' : 'none';
  });
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Initialize navigation when DOM loads
document.addEventListener('DOMContentLoaded', setupNavigation);