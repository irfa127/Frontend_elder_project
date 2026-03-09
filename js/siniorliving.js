initPage();

async function initPage() {
  const container = document.getElementById("communitiesContainer");
  try {
    const response = await fetch("http://127.0.0.1:8000/communities/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch communities");

    const communities = await response.json();
    container.innerHTML = "";

    if (communities.length === 0) {
      container.innerHTML = "<p style='text-align: center; width: 100%;'>No communities found.</p>";
      return;
    }

    communities.forEach((comm, index) => {
      const delay = index * 0.1;
      const card = document.createElement("div");
      card.className = "community-card";
      card.setAttribute("data-aos", "fade-up");
      card.style.animationDelay = `${delay}s`;


      const facilities = (comm.facilities || "24/7 Care,Dining").split(',');
      const tagsHTML = facilities.map(fac => {
        let icon = 'fa-check-circle';
        if (fac.includes('Dining')) icon = 'fa-utensils';
        if (fac.includes('Care')) icon = 'fa-heartbeat';
        if (fac.includes('AC')) icon = 'fa-snowflake';
        if (fac.includes('Wi-Fi')) icon = 'fa-wifi';
        if (fac.includes('Garden')) icon = 'fa-leaf';

        return `<span class="tag-item"><i class="fas ${icon}"></i> ${fac.trim()}</span>`;
      }).join('');

      card.innerHTML = `
                        <div class="community-image-container">
                          ${comm.is_featured ? '<span class="label-badge label-featured">Featured</span>' : ''}
                          ${comm.specialty_label ? `<span class="label-badge label-premium" style="left: auto; right: 10px; background: rgba(0,0,0,0.6);">${comm.specialty_label}</span>` : ''}
                          <img
                            src="${comm.image_url || 'https://images.unsplash.com/photo-1549439602-43ebca23d7af?w=600&auto=format&fit=crop&q=60'}" 
                            class="community-image"
                            alt="${comm.name}"
                          />
                        </div>
                        <div class="community-content">
                          <h3 class="community-name">${comm.name}</h3>
                          <div class="community-location">
                            <i class="fas fa-map-marker-alt"></i> ${comm.location}
                          </div>
                          <p class="community-desc">
                            ${comm.description}
                          </p>
                          <div class="price-tag" style="margin: 10px 0; color: #059669; font-weight:700;">
                                ${(comm.pricing || comm.price_range || comm.price) ? `${comm.pricing || comm.price_range || comm.price} per month` : 'Contact for pricing'}
                          </div>
                          <div class="tag-container">
                            ${tagsHTML}
                          </div>
                          <button
                            class="btn btn-green"
                            onclick="window.location.href='patient-senior-living-details.html?id=${comm.id}'"
                          >
                            View Details
                          </button>
                        </div>
                    `;
      container.appendChild(card);
    });

  } catch (e) {
    console.error(e);
    container.innerHTML = "<p style='text-align: center; color: red;'>Error loading communities.</p>";
  }
}
