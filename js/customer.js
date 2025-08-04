// customer.js - Full updated version
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the page
  loadRestaurants();
  
  // Set up filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active button
      document.querySelectorAll('.filter-btn').forEach(b => 
        b.classList.remove('active'));
      this.classList.add('active');
      
      // Update filter and reload
      currentFilter = this.dataset.filter;
      loadRestaurants();
    });
  });
});

function loadRestaurants() {
  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  
  // Filter out removed restaurants and their data
  const activeRestaurants = restaurants.filter(r => 
    r.status === 'approved' && 
    !r.removed && 
    r.active !== false
  );

  // Also filter out any restaurant data from other collections
  const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  if (user && favorites[user.email]) {
    // Clean favorites list
    favorites[user.email] = favorites[user.email].filter(id => 
      restaurants.some(r => r.id === id && !r.removed)
    );
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  displayRestaurants(activeRestaurants);
}

function displayRestaurants(restaurants) {
  const container = document.getElementById('restaurants-container');
  
  if (restaurants.length === 0) {
    container.innerHTML = '<p>No restaurants found matching your criteria.</p>';
    return;
  }

  container.innerHTML = restaurants.map(restaurant => `
    <div class="restaurant-card">
      <h3>${restaurant.name}</h3>
      ${restaurant.categories ? `
        <div class="restaurant-categories">
          ${restaurant.categories.map(cat => `
            <span class="category-tag ${cat}">${cat}</span>
          `).join('')}
        </div>
      ` : ''}
      <p>${restaurant.description || 'No description available'}</p>
      <p><strong>Location:</strong> ${restaurant.location || 'Not specified'}</p>
      
      <button onclick="toggleMenu('${restaurant.id}')" class="btn btn-primary">
        View Menu
      </button>
      
      <div id="menu-${restaurant.id}" style="display: none; margin-top: 20px;">
        <h4>Menu</h4>
        ${restaurant.menu && restaurant.menu.length > 0 ? 
          restaurant.menu.map(item => `
            <div class="menu-item">
              <h5>${item.name} - $${item.price}</h5>
              ${item.description ? `<p>${item.description}</p>` : ''}
              ${item.category ? `<span class="category-tag">${item.category}</span>` : ''}
              <div class="order-controls">
                <input type="number" id="qty-${restaurant.id}-${item.id}" min="1" value="1" style="width: 50px;">
                <button onclick="addToOrder('${restaurant.id}', '${item.id}')" class="btn btn-sm">
                  Add to Order
                </button>
              </div>
            </div>
          `).join('') : '<p>No menu items available.</p>'}
        
        <div id="order-summary-${restaurant.id}" style="margin-top: 20px; display: none;">
          <h4>Your Order</h4>
          <div id="order-items-${restaurant.id}"></div>
          <p id="order-total-${restaurant.id}"></p>
          <button onclick="submitOrder('${restaurant.id}')" class="btn btn-primary">
            Submit Order
          </button>
        </div>
      </div>
      
      <div class="reviews-container">
        <h4>Reviews (${restaurant.reviews ? restaurant.reviews.length : 0})</h4>
        ${restaurant.reviews && restaurant.reviews.length > 0 ? 
          restaurant.reviews.map(review => `
            <div class="review">
              <strong>${review.user || 'Anonymous'}</strong>
              <p>${review.text}</p>
              <small>${review.date ? new Date(review.date).toLocaleString() : ''}</small>
              ${review.reply ? `
                <div class="review-owner-reply">
                  <strong>Owner response:</strong>
                  <p>${review.reply}</p>
                </div>
              ` : ''}
            </div>
          `).join('') : '<p>No reviews yet.</p>'}
        
        <div class="add-review">
          <textarea id="review-text-${restaurant.id}" 
            placeholder="Write your review..."></textarea>
          <button onclick="submitReview('${restaurant.id}')" 
            class="btn btn-primary">Submit Review</button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleMenu(restaurantId) {
  const menu = document.getElementById(`menu-${restaurantId}`);
  const isHidden = menu.style.display === 'none' || 
                 window.getComputedStyle(menu).display === 'none';
  
  // Toggle with smooth animation
  if (isHidden) {
    menu.style.display = 'block';
    menu.style.animation = 'fadeIn 0.3s ease-in-out';
    menu.setAttribute('aria-expanded', 'true');
    
    // Focus first interactive element for keyboard users
    setTimeout(() => {
      const firstItem = menu.querySelector('button, [tabindex="0"]');
      if (firstItem) firstItem.focus();
    }, 300);
  } else {
    menu.style.animation = 'fadeOut 0.3s ease-in-out';
    menu.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      menu.style.display = 'none';
    }, 280);
  }
}

function addToOrder(restaurantId, itemId) {
  const quantity = parseInt(document.getElementById(`qty-${restaurantId}-${itemId}`).value);
  if (isNaN(quantity) || quantity < 1) {
    alert('Please enter a valid quantity');
    return;
  }

  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurant = restaurants.find(r => r.id === restaurantId);
  const item = restaurant.menu.find(i => i.id === itemId);

  let currentOrder = JSON.parse(sessionStorage.getItem(`currentOrder-${restaurantId}`)) || [];
  
  // Check if item already exists in order
  const existingItemIndex = currentOrder.findIndex(i => i.id === itemId);
  if (existingItemIndex !== -1) {
    currentOrder[existingItemIndex].quantity += quantity;
  } else {
    currentOrder.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity
    });
  }

  sessionStorage.setItem(`currentOrder-${restaurantId}`, JSON.stringify(currentOrder));
  updateOrderSummary(restaurantId);
}

function updateOrderSummary(restaurantId) {
  const currentOrder = JSON.parse(sessionStorage.getItem(`currentOrder-${restaurantId}`)) || [];
  const orderItemsContainer = document.getElementById(`order-items-${restaurantId}`);
  const orderSummary = document.getElementById(`order-summary-${restaurantId}`);
  
  if (currentOrder.length === 0) {
    orderSummary.style.display = 'none';
    return;
  }

  orderSummary.style.display = 'block';
  
  let total = 0;
  orderItemsContainer.innerHTML = currentOrder.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return `
      <div class="order-item">
        ${item.name} - $${item.price} x ${item.quantity} = $${itemTotal.toFixed(2)}
        <button onclick="removeFromOrder('${restaurantId}', '${item.id}')" class="btn btn-sm btn-danger">
          Remove
        </button>
      </div>
    `;
  }).join('');

  document.getElementById(`order-total-${restaurantId}`).innerHTML = `
    <strong>Total: $${total.toFixed(2)}</strong>
  `;
}

function removeFromOrder(restaurantId, itemId) {
  let currentOrder = JSON.parse(sessionStorage.getItem(`currentOrder-${restaurantId}`)) || [];
  currentOrder = currentOrder.filter(item => item.id !== itemId);
  sessionStorage.setItem(`currentOrder-${restaurantId}`, JSON.stringify(currentOrder));
  updateOrderSummary(restaurantId);
}

function submitOrder(restaurantId) {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    alert('You must be logged in to place an order');
    return;
  }

  const currentOrder = JSON.parse(sessionStorage.getItem(`currentOrder-${restaurantId}`)) || [];
  if (currentOrder.length === 0) {
    alert('Your order is empty');
    return;
  }

  let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurantIndex = restaurants.findIndex(r => r.id === restaurantId);
  
  if (restaurantIndex !== -1) {
    // Calculate total
    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order object
    const order = {
      id: Date.now().toString(),
      customerEmail: user.email,
      items: currentOrder,
      total: total,
      orderDate: new Date().toISOString(),
      status: 'pending'
    };

    // Initialize orders array if it doesn't exist
    if (!restaurants[restaurantIndex].orders) {
      restaurants[restaurantIndex].orders = [];
    }

    // Add order to restaurant
    restaurants[restaurantIndex].orders.push(order);
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    
    // Clear current order
    sessionStorage.removeItem(`currentOrder-${restaurantId}`);
    updateOrderSummary(restaurantId);
    
    // Add notification for restaurant owner
    addNewOrderNotification(
      restaurantId,
      restaurants[restaurantIndex].name,
      restaurants[restaurantIndex].owner,
      order.id,
      total
    );
    
    alert('Order placed successfully!');
  }
}

function addNewOrderNotification(restaurantId, restaurantName, ownerEmail, orderId, total) {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  
  notifications.push({
    recipient: ownerEmail,
    type: 'new-order',
    restaurantId,
    restaurantName,
    orderId,
    total,
    date: new Date().toISOString(),
    read: false
  });
  
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

function submitReview(restaurantId) {
  const text = document.getElementById(`review-text-${restaurantId}`).value.trim();
  if (!text) {
    alert('Please write a review before submitting');
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    alert('You must be logged in to leave a review');
    return;
  }
  
  let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const restaurantIndex = restaurants.findIndex(r => r.id === restaurantId);
  
  if (restaurantIndex !== -1) {
    // Initialize reviews array if it doesn't exist
    if (!restaurants[restaurantIndex].reviews) {
      restaurants[restaurantIndex].reviews = [];
    }
    
    // Add new review
    restaurants[restaurantIndex].reviews.push({
      user: user.email,
      text,
      date: new Date().toISOString(),
      reply: null
    });
    
    // Save back to localStorage
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    
    // Refresh display
    loadRestaurants();
    
    // Clear the textarea
    document.getElementById(`review-text-${restaurantId}`).value = '';
  }
}