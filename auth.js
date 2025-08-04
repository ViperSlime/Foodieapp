// Handle registration
document.getElementById('register-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.querySelector('input[name="role"]:checked').value;
  
  // Register user
  const users = JSON.parse(localStorage.getItem('users')) || [];
  users.push({ email, password, role });
  localStorage.setItem('users', JSON.stringify(users));
  
  // Auto-login
  localStorage.setItem('currentUser', JSON.stringify({ email, role }));
  window.location.href = role + '.html';
});

// Handle login
document.getElementById('login-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = user.role + '.html';
  } else {
    document.getElementById('login-error').textContent = 'Invalid credentials';
  }
});