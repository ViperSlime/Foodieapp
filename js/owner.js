document.addEventListener('DOMContentLoaded', function() {
  // Initialize the dashboard
  loadSubmissions();
  setupCategoryTags();
  loadNotifications();
  loadRestaurantSelectors();
  
  // Form submission handler
  document.getElementById('restaurant-form').addEventListener('submit', function(e) {
    e.preventDefault();
    submitRestaurant();
  });

  // Event listeners for selectors
  document.getElementById('restaurant-select').addEventListener('change', function() {
    loadReviews(this.value);
  });

  document.getElementById('menu-restaurant-select').addEventListener('change', function() {
    loadMenuManagement(this.value);
  });

  document.getElementById('order-restaurant-select').addEventListener('change', function() {
    loadOrderHistory(this.value);
  });
});

function setupCategoryTags() {
  const tags = document.querySelectorAll('#category-tags .tag');
  tags.forEach(tag => {
    tag.addEventListener('click', function() {
      this.classList.toggle('selected');
      updateSelectedCategories();
    });
  });
}

function updateSelectedCategories() {
  const selectedTags = document.querySelectorAll('#category-tags .tag.selected');
  const categories = Array.from(selectedTags).map(tag => tag.dataset.category);
  document.getElementById('selected-categories').value = categories.join(',');
}

function submitRestaurant() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    alert('You must be logged in to submit a restaurant');
    return;
  }

  const name = document.getElementById('restaurant-name').value;
  const location = document.getElementById('restaurant-location').value;
  const description = document.getElementById('restaurant-description').value;
  const categories = document.getElementById('selected-categories').value.split(',');

  // Create restaurant object
  const restaurant = {
    id: Date.now().toString(),
    name,
    location,
    description,
    categories,
    owner: user.email,
    status: 'pending',
    dateSubmitted: new Date().toISOString(),
    reviews: [],
    menu: [],
    orders: []
  };

  // Save to localStorage
  let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  restaurants.push(restaurant);
  localStorage.setItem('restaurants', JSON.stringify(restaurants));

  // Clear form
  document.getElementById('restaurant-form').reset();
  document.querySelectorAll('#category-tags .tag').forEach(tag => {
    tag.classList.remove('selected');
  });

  // Update UI
  loadSubmissions();
  loadRestaurantSelectors();
  alert('Restaurant submitted for admin approval!');
}

function loadSubmissions() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;

  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const myRestaurants = restaurants.filter(r => r.owner === user.email);
  const statusContainer = document.getElementById('submission-status');

  if (myRestaurants.length === 0) {
    statusContainer.innerHTML = '<p>You have no submissions yet.</p>';
    return;
  }

  statusContainer.innerHTML = myRestaurants.map(restaurant => `
    <div class="submission">
      <h3>${restaurant.name}</h3>
      <span class="status-badge status-${restaurant.status}">
        ${restaurant.status === 'pending' ? 'Pending Approval' : 
          restaurant.status === 'approved' ? 'Approved' : 'Rejected'}
      </span>
      ${restaurant.status === 'rejected' && restaurant.rejectionReason ? `
        <p><strong>Rejection Reason:</strong> ${restaurant.rejectionReason}</p>
      ` : ''}
      <p>${restaurant.description}</p>
      <div class="categories">
        ${restaurant.categories.map(cat => `<span class="tag">${cat}</span>`).join('')}
      </div>
      <p><small>Submitted: ${new Date(restaurant.dateSubmitted).toLocaleDateString()}</small></p>
      ${restaurant.approvalDate ? `
        <p><small>${restaurant.status === 'approved' ? 'Approved' : 'Rejected'} on: 
        ${new Date(restaurant.approvalDate || restaurant.rejectionDate).toLocaleDateString()}</small></p>
      ` : ''}
    </div>
  `).join('');
}

function loadRestaurantSelectors() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;

  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const myRestaurants = restaurants.filter(r => r.owner === user.email);
  
  // Load selector for reviews (only approved restaurants)
  const approvedForReviews = myRestaurants.filter(r => r.status === 'approved');
  const reviewSelector = document.getElementById('restaurant-select');
  updateRestaurantSelector(reviewSelector, approvedForReviews);
  
  // Load selector for menu management (only approved restaurants)
  const menuSelector = document.getElementById('menu-restaurant-select');
  updateRestaurantSelector(menuSelector, approvedForReviews);
  
  // Load selector for order history (all restaurants)
  const orderSelector = document.getElementById('order-restaurant-select');
  updateRestaurantSelector(orderSelector, myRestaurants);
}

function updateRestaurantSelector(selector, restaurants) {
  // Clear existing options except the first one
  while (selector.options.length > 1) {
    selector.remove(1);
  }

  if (restaurants.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No restaurants available';
    selector.appendChild(option);
    return;
  }

  restaurants.forEach(restaurant => {
    const option = document.createElement('option');
    option.value = restaurant.id;
    option.textContent = restaurant.name;
    selector.appendChild(option);
  });
}

function loadReviews(restaurantId) {
  const container = document.getElementById('reviews-container');

  if (!restaurantId) {
    container.innerHTML = '<p>Please select a restaurant to view and reply to reviews</p>';
    return;
  }

  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);

  if (!restaurant || !restaurant.reviews || restaurant.reviews.length === 0) {
    container.innerHTML = '<p>No reviews yet for this restaurant.</p>';
    return;
  }

  container.innerHTML = restaurant.reviews.map((review, index) => `
    <div class="review-item">
      <h4>Review from ${review.user}</h4>
      <p>${review.text}</p>
      <small>${new Date(review.date).toLocaleString()}</small>
      ${review.reply ? `
        <div class="reply-section">
          <h5>Your Reply:</h5>
          <p>${review.reply}</p>
          <small>${new Date(review.replyDate).toLocaleString()}</small>
        </div>
      ` : `
        <div class="reply-section">
          <div class="reply-form">
            <textarea id="reply-${restaurantId}-${index}" placeholder="Write your reply..."></textarea>
            <button onclick="submitReply('${restaurantId}', ${index})" class="btn btn-primary">
              Submit Reply
            </button>
          </div>
        </div>
      `}
    </div>
  `).join('');
}

function submitReply(restaurantId, reviewIndex) {
  const replyText = document.getElementById(`reply-${restaurantId}-${reviewIndex}`).value.trim();
  if (!replyText) {
    alert('Please write a reply before submitting');
    return;
  }

  let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);
  
  if (restaurant && restaurant.reviews[reviewIndex]) {
    restaurant.reviews[reviewIndex].reply = replyText;
    restaurant.reviews[reviewIndex].replyDate = new Date().toISOString();
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    
    // Add notification for the customer
    addReviewReplyNotification(
      restaurantId,
      restaurant.name,
      restaurant.reviews[reviewIndex].user,
      replyText
    );
    
    loadReviews(restaurantId);
    alert('Reply submitted successfully!');
  }
}

function loadMenuManagement(restaurantId) {
  const container = document.getElementById('menu-management-container');
  const formContainer = document.getElementById('menu-form-container');
  const menuList = document.getElementById('menu-list-container');

  if (!restaurantId) {
    container.innerHTML = '<p>Please select a restaurant to manage its menu</p>';
    formContainer.style.display = 'none';
    menuList.innerHTML = '';
    return;
  }

  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);

  container.innerHTML = `<h3>Manage Menu for ${restaurant.name}</h3>`;
  formContainer.style.display = 'block';
  
  // Load existing menu items
  loadMenuItems(restaurantId);
}

// Add these functions to your existing owner.js

function loadMenuManagement(restaurantId) {
  const container = document.getElementById('menu-management-container');
  const formContainer = document.getElementById('menu-form-container');
  const menuList = document.getElementById('menu-list-container');

  if (!restaurantId) {
    container.innerHTML = '<p>Please select a restaurant to manage its menu</p>';
    formContainer.style.display = 'none';
    menuList.innerHTML = '';
    return;
  }

  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);

  container.innerHTML = `<h3>Manage Menu for ${restaurant.name}</h3>`;
  formContainer.style.display = 'block';
  
  // Load existing menu items
  loadMenuItems(restaurantId);
}

function loadMenuItems(restaurantId) {
  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);
  const menuList = document.getElementById('menu-list-container');

  if (!restaurant || !restaurant.menu || restaurant.menu.length === 0) {
    menuList.innerHTML = '<p>No menu items yet. Add your first item!</p>';
    return;
  }

  menuList.innerHTML = restaurant.menu.map((item, index) => `
    <div class="menu-item-card">
      <div>
        <h4>${item.name} - $${item.price}</h4>
        ${item.description ? `<p>${item.description}</p>` : ''}
        ${item.category ? `<span class="category-tag">${item.category}</span>` : ''}
        <small>Added: ${new Date(item.dateAdded).toLocaleDateString()}</small>
      </div>
      <div class="menu-item-actions">
        <button onclick="editMenuItem('${restaurantId}', ${index})" class="btn btn-outline">Edit</button>
        <button onclick="deleteMenuItem('${restaurantId}', ${index})" class="btn btn-danger">Delete</button>
      </div>
    </div>
  `).join('');
}

function addMenuItem() {
  const restaurantId = document.getElementById('menu-restaurant-select').value;
  if (!restaurantId) return;

  const name = document.getElementById('menu-item-name').value.trim();
  const price = document.getElementById('menu-item-price').value.trim();
  const description = document.getElementById('menu-item-description').value.trim();
  const category = document.getElementById('menu-item-category').value;

  if (!name || !price) {
    alert('Please fill in at least name and price');
    return;
  }

  if (isNaN(parseFloat(price))) {
    alert('Please enter a valid price');
    return;
  }

  let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurantIndex = restaurants.findIndex(r => r.id === restaurantId);

  if (restaurantIndex !== -1) {
    // Initialize menu array if it doesn't exist
    if (!restaurants[restaurantIndex].menu) {
      restaurants[restaurantIndex].menu = [];
    }

    // Add new menu item
    restaurants[restaurantIndex].menu.push({
      id: Date.now().toString(),
      name,
      price: parseFloat(price).toFixed(2),
      description,
      category,
      dateAdded: new Date().toISOString()
    });

    // Save back to localStorage
    localStorage.setItem('restaurants', JSON.stringify(restaurants));

    // Clear form and reload menu
    document.getElementById('menu-item-name').value = '';
    document.getElementById('menu-item-price').value = '';
    document.getElementById('menu-item-description').value = '';
    loadMenuItems(restaurantId);
    alert('Menu item added successfully!');
  }
}

function editMenuItem(restaurantId, itemIndex) {
  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);
  
  if (restaurant && restaurant.menu[itemIndex]) {
    const item = restaurant.menu[itemIndex];
    const newName = prompt('Edit item name:', item.name);
    const newPrice = prompt('Edit item price:', item.price);
    const newDesc = prompt('Edit item description:', item.description || '');
    const newCategory = prompt('Edit item category:', item.category || '');

    if (newName && newPrice) {
      if (isNaN(parseFloat(newPrice))) {
        alert('Please enter a valid price');
        return;
      }

      item.name = newName;
      item.price = parseFloat(newPrice).toFixed(2);
      item.description = newDesc;
      item.category = newCategory;
      localStorage.setItem('restaurants', JSON.stringify(restaurants));
      loadMenuItems(restaurantId);
      alert('Menu item updated successfully!');
    }
  }
}

function deleteMenuItem(restaurantId, itemIndex) {
  if (confirm('Are you sure you want to delete this menu item?')) {
    let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    const restaurantIndex = restaurants.findIndex(r => r.id === restaurantId);
    
    if (restaurantIndex !== -1 && restaurants[restaurantIndex].menu[itemIndex]) {
      restaurants[restaurantIndex].menu.splice(itemIndex, 1);
      localStorage.setItem('restaurants', JSON.stringify(restaurants));
      loadMenuItems(restaurantId);
      alert('Menu item deleted successfully!');
    }
  }
}

function loadOrderHistory(restaurantId) {
  const container = document.getElementById('order-history-container');

  if (!restaurantId) {
    container.innerHTML = '<p>Please select a restaurant to view order history</p>';
    return;
  }

  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);

  if (!restaurant || !restaurant.orders || restaurant.orders.length === 0) {
    container.innerHTML = '<p>No orders yet for this restaurant.</p>';
    return;
  }

  // Sort orders by date (newest first)
  const sortedOrders = [...restaurant.orders].sort((a, b) => 
    new Date(b.orderDate) - new Date(a.orderDate)
  );

  container.innerHTML = sortedOrders.map(order => `
    <div class="order-history-item">
      <h4>Order #${order.id}</h4>
      <p><strong>Customer:</strong> ${order.customerEmail}</p>
      <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
      <p><strong>Status:</strong> ${order.status || 'Completed'}</p>
      <h5>Items:</h5>
      <ul>
        ${order.items.map(item => `
          <li>${item.name} - $${item.price} (Qty: ${item.quantity})</li>
        `).join('')}
      </ul>
      <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
    </div>
  `).join('');
}

function addReviewReplyNotification(restaurantId, restaurantName, customerEmail, reply) {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  
  notifications.push({
    recipient: customerEmail,
    type: 'review-reply',
    restaurantId,
    restaurantName,
    reply,
    date: new Date().toISOString(),
    read: false
  });
  
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

function loadNotifications() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;

  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const myNotifications = notifications
    .filter(n => n.recipient === user.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

  const notificationBadge = document.getElementById('notification-badge');
  const notificationList = document.getElementById('notification-list');

  if (notificationBadge) {
    const unreadCount = myNotifications.filter(n => !n.read).length;
    notificationBadge.textContent = unreadCount > 0 ? unreadCount : '';
  }

  if (notificationList) {
    notificationList.innerHTML = myNotifications.length > 0 ? 
      myNotifications.map(notif => `
        <div class="notification ${notif.read ? 'read' : 'unread'}">
          ${notif.type === 'restaurant-approval' ? `
            <p>Your restaurant "${notif.restaurantName}" was 
            <strong>${notif.status === 'approved' ? 'approved' : 'rejected'}</strong>
            ${notif.reason ? ` (Reason: ${notif.reason})` : ''}</p>
          ` : ''}
          ${notif.type === 'review-reply' ? `
            <p>The owner has replied to your review for "${notif.restaurantName}":</p>
            <p><em>"${notif.reply}"</em></p>
          ` : ''}
          ${notif.type === 'new-review' ? `
            <p>New review for your restaurant "${notif.restaurantName}":</p>
            <p><em>"${notif.reviewText}"</em></p>
          ` : ''}
          ${notif.type === 'new-order' ? `
            <p>New order received for "${notif.restaurantName}":</p>
            <p>Order #${notif.orderId} - Total: $${notif.total.toFixed(2)}</p>
          ` : ''}
          <small>${new Date(notif.date).toLocaleString()}</small>
        </div>
      `).join('') : '<p>No new notifications</p>';
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById('notification-dropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  
  // Mark as read when opened
  if (dropdown.style.display === 'block') {
    markNotificationsAsRead();
  }
}

function markNotificationsAsRead() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;

  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications = notifications.map(n => {
    if (n.recipient === user.email) {
      return { ...n, read: true };
    }
    return n;
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
  loadNotifications();
}
function loadMyRestaurants() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;
  
  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  
  // Only show active, non-removed restaurants
  const myRestaurants = restaurants.filter(r => 
    r.owner === user.email && 
    r.status === 'approved' && 
    !r.removed &&
    r.active !== false
  );
  
  // Clean up owner's restaurant list
  if (user.restaurants) {
    user.restaurants = user.restaurants.filter(id =>
      restaurants.some(r => r.id === id && !r.removed)
    );
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  displayMyRestaurants(myRestaurants);
}
// In a shared utilities file (utils.js)
function isRestaurantActive(restaurantId) {
  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);
  return restaurant && 
         restaurant.status === 'approved' && 
         !restaurant.removed &&
         restaurant.active !== false;
}

function cleanRestaurantData(restaurantId) {
  // This function can be called to ensure all traces are removed
  let orders = JSON.parse(localStorage.getItem('orders')) || [];
  let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
  
  orders = orders.filter(o => o.restaurantId !== restaurantId);
  reviews = reviews.filter(r => r.restaurantId !== restaurantId);
  
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('reviews', JSON.stringify(reviews));
}