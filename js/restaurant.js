// Restaurant data structure
let restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];

// Save restaurant with categories
function saveRestaurant() {
  const categories = document.getElementById('restaurant-categories').value.split(',');
  
  const restaurant = {
    id: Date.now(),
    name: document.getElementById('restaurant-name').value,
    location: document.getElementById('restaurant-location').value,
    description: document.getElementById('restaurant-description').value,
    categories,
    owner: JSON.parse(localStorage.getItem('currentUser')).email,
    status: 'pending',
    reviews: []
  };
  
  restaurants.push(restaurant);
  localStorage.setItem('restaurants', JSON.stringify(restaurants));
}

// Filter restaurants by category
function filterRestaurants(category) {
  if (category === 'all') {
    return restaurants.filter(r => r.status === 'approved');
  }
  return restaurants.filter(r => 
    r.status === 'approved' && r.categories.includes(category)
  );
}

// Display filtered restaurants
function displayRestaurants(filteredRestaurants) {
  const container = document.querySelector('.restaurants-container');
  container.innerHTML = '';
  
  filteredRestaurants.forEach(restaurant => {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.innerHTML = `
      <h3>${restaurant.name}</h3>
      <div class="restaurant-categories">
        ${restaurant.categories.map(cat => 
          `<span class="category-tag ${cat}">${cat}</span>`
        ).join('')}
      </div>
      <p>${restaurant.description}</p>
      <div class="reviews-container">
        <h4>Reviews (${restaurant.reviews.length})</h4>
        <div class="review-list">
          ${restaurant.reviews.map(review => `
            <div class="review">
              <strong>${review.user}</strong>
              <p>${review.text}</p>
              <small>${new Date(review.date).toLocaleString()}</small>
              ${review.reply ? `
                <div class="review-owner-reply">
                  <strong>Owner:</strong> ${review.reply}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div class="add-review">
          <textarea id="review-${restaurant.id}" 
            placeholder="Write your review..."></textarea>
          <button onclick="submitReview(${restaurant.id})">Submit Review</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Submit review
function submitReview(restaurantId) {
  const reviewText = document.getElementById(`review-${restaurantId}`).value;
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  const review = {
    user: user.email,
    text: reviewText,
    date: new Date().toISOString(),
    reply: null
  };
  
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    restaurant.reviews.push(review);
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    displayRestaurants(filterRestaurants(currentFilter));
  }
}

// Owner reply to review
function replyToReview(restaurantId, reviewIndex) {
  const replyText = prompt('Enter your reply:');
  if (replyText) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant && restaurant.reviews[reviewIndex]) {
      restaurant.reviews[reviewIndex].reply = replyText;
      localStorage.setItem('restaurants', JSON.stringify(restaurants));
      displayRestaurants(filterRestaurants(currentFilter));
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Load restaurants
  restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
  
  // Set up filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => 
        b.classList.remove('active'));
      this.classList.add('active');
      
      const filter = this.dataset.filter;
      displayRestaurants(filterRestaurants(filter));
    });
  });
  
  // Initial display
  displayRestaurants(filterRestaurants('all'));
});