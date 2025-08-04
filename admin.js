let currentRestaurantId = null;
let restaurantToRemove = null;

document.addEventListener('DOMContentLoaded', () => {
  loadPendingRestaurants();
  loadApprovalHistory();
});

function loadPendingRestaurants() {
  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const pending = restaurants.filter(r => r.status === 'pending');
  const container = document.getElementById('pending-restaurants');

  if (pending.length === 0) {
    container.innerHTML = '<p>No pending restaurants for approval.</p>';
    return;
  }

  container.innerHTML = pending.map(restaurant => `
    <div class="restaurant-card">
      <h3>${restaurant.name}</h3>
      <p>${restaurant.description}</p>
      <p><strong>Location:</strong> ${restaurant.location}</p>
      <p><strong>Owner:</strong> ${restaurant.owner}</p>
      <div class="restaurant-tags">
        ${restaurant.categories.map(tag => `<span>${tag}</span>`).join('')}
      </div>
      <div class="restaurant-actions">
        <button onclick="approveRestaurant('${restaurant.id}')" class="btn btn-success">Approve</button>
        <button onclick="initiateRejection('${restaurant.id}')" class="btn btn-danger">Reject</button>
      </div>
    </div>
  `).join('');
}

function loadApprovalHistory() {
  const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  const approved = restaurants.filter(r => r.status === 'approved' && !r.removed);
  const container = document.getElementById('approved-restaurants');

  if (approved.length === 0) {
    container.innerHTML = '<p>No approved restaurants yet.</p>';
    return;
  }

  container.innerHTML = approved.map(restaurant => `
    <div class="restaurant-card">
      <h3>${restaurant.name} <span class="status-badge status-approved">Approved</span></h3>
      <p>${restaurant.description}</p>
      <p><strong>Location:</strong> ${restaurant.location}</p>
      <p><strong>Owner:</strong> ${restaurant.owner}</p>
      <p><strong>Approved On:</strong> ${new Date(restaurant.approvalDate).toLocaleDateString()}</p>
      <div class="restaurant-tags">
        ${restaurant.categories.map(tag => `<span>${tag}</span>`).join('')}
      </div>
      <div class="restaurant-actions">
        <button onclick="initiateRemoval('${restaurant.id}')" class="btn btn-danger">Remove Restaurant</button>
      </div>
    </div>
  `).join('');
}

function approveRestaurant(id) {
  let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  
  restaurants = restaurants.map(r => {
    if (r.id === id) {
      return { 
        ...r, 
        status: 'approved',
        approvalDate: new Date().toISOString(),
        removed: false,
        active: true
      };
    }
    return r;
  });
  
  localStorage.setItem('restaurants', JSON.stringify(restaurants));
  updateOwnerNotification(id, 'approved');
  loadPendingRestaurants();
  loadApprovalHistory();
  alert('Restaurant approved successfully!');
}

function initiateRejection(id) {
  currentRestaurantId = id;
  document.getElementById('feedback-modal').style.display = 'flex';
}

function cancelRejection() {
  document.getElementById('feedback-modal').style.display = 'none';
  document.getElementById('rejection-reason').value = '';
  currentRestaurantId = null;
}

function confirmRejection() {
  const reason = document.getElementById('rejection-reason').value.trim();
  if (!reason) {
    alert('Please provide a reason for rejection');
    return;
  }

  let restaurants = JSON.parse(localStorage.getItem('restaurants'));
  restaurants = restaurants.filter(r => r.id !== currentRestaurantId);
  localStorage.setItem('restaurants', JSON.stringify(restaurants));
  
  updateOwnerNotification(currentRestaurantId, 'rejected', reason);
  
  document.getElementById('feedback-modal').style.display = 'none';
  document.getElementById('rejection-reason').value = '';
  loadPendingRestaurants();
  loadApprovalHistory();
  alert('Restaurant rejected with feedback sent to owner.');
  currentRestaurantId = null;
}

function initiateRemoval(id) {
  restaurantToRemove = id;
  if (confirm('Are you sure you want to remove this restaurant? This will immediately hide it from all users.')) {
    confirmRemoval();
  } else {
    restaurantToRemove = null;
  }
}

function confirmRemoval() {
  if (!restaurantToRemove) return;
  
  const reason = prompt("Please provide a reason for removal:");
  if (reason === null) return;

  let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  let users = JSON.parse(localStorage.getItem('users')) || [];
  let favorites = JSON.parse(localStorage.getItem('favorites')) || {};
  let orders = JSON.parse(localStorage.getItem('orders')) || [];
  let reviews = JSON.parse(localStorage.getItem('reviews')) || [];

  // Mark restaurant as removed
  restaurants = restaurants.map(r => {
    if (r.id === restaurantToRemove) {
      return {
        ...r,
        status: 'removed',
        removed: true,
        removalDate: new Date().toISOString(),
        removalReason: reason,
        active: false
      };
    }
    return r;
  });

  // Clean up favorites
  for (const userEmail in favorites) {
    favorites[userEmail] = favorites[userEmail].filter(id => id !== restaurantToRemove);
  }

  // Cancel pending orders
  orders = orders.map(order => {
    if (order.restaurantId === restaurantToRemove && order.status === 'pending') {
      return {
        ...order,
        status: 'cancelled',
        cancellationReason: 'Restaurant removed from platform'
      };
    }
    return order;
  });

  // Remove from owner's dashboard
  users = users.map(user => {
    if (user.restaurants && user.restaurants.includes(restaurantToRemove)) {
      return {
        ...user,
        restaurants: user.restaurants.filter(id => id !== restaurantToRemove)
      };
    }
    return user;
  });

  // Archive reviews
  reviews = reviews.map(review => {
    if (review.restaurantId === restaurantToRemove) {
      return {
        ...review,
        hidden: true
      };
    }
    return review;
  });

  // Save all data
  localStorage.setItem('restaurants', JSON.stringify(restaurants));
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('favorites', JSON.stringify(favorites));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('reviews', JSON.stringify(reviews));

  // Notify owner
  updateOwnerNotification(
    restaurantToRemove, 
    'removed', 
    reason
  );

  restaurantToRemove = null;
  loadApprovalHistory();
  alert('Restaurant and all associated data removed successfully.');
}

function updateOwnerNotification(restaurantId, status, reason = '') {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const restaurant = JSON.parse(localStorage.getItem('restaurants'))
    .find(r => r.id === restaurantId);
  
  if (!restaurant) return;

  notifications.push({
    recipient: restaurant.owner,
    type: 'restaurant-approval',
    status,
    restaurantId,
    restaurantName: restaurant.name,
    reason,
    date: new Date().toISOString(),
    read: false
  });

  localStorage.setItem('notifications', JSON.stringify(notifications));
}