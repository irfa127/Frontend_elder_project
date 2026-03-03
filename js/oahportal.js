const API_URL = "https://elder-backend-a7db.vercel.app";
let currentCommunity = null;

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html";
    return;
  }
  const user = JSON.parse(userStr);

  try {
    const response = await fetch(`${API_URL}/communities/manager/${user.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const comms = await response.json();

    if (comms && comms.length > 0) {
      currentCommunity = comms[0];
      populateForm(currentCommunity);
    } else {
      updatePreview();
    }
  } catch (e) {
    console.error(e);
    alert("Error loading community details");
  }

  const saveBtn = document.querySelector("button.btn-primary");
  if (saveBtn) saveBtn.onclick = saveChanges;
}

function populateForm(data) {
  document.getElementById("communityId").value = data.id;
  document.getElementById("editName").value = data.name;
  document.getElementById("editLocation").value = data.location;
  document.getElementById("editDesc").value = data.description || "";
  document.getElementById("editPrice").value = data.pricing || data.price_range || data.price || "";
  document.getElementById("editPhone").value = data.phone || "";
  document.getElementById("editImg").value = data.image_url || "";
  document.getElementById("editLabel").value =
    data.specialty_label || "Personalized Care";

  const facilities = (data.facilities || "").split(",");
  document.querySelectorAll(".facility-check").forEach((cb) => {
    cb.checked = facilities.includes(cb.value);
  });

  updatePreview();
}

function updatePreview() {
  const nameEl = document.getElementById("editName");
  const locEl = document.getElementById("editLocation");
  const descEl = document.getElementById("editDesc");
  const priceEl = document.getElementById("editPrice");
  const labelEl = document.getElementById("editLabel");
  const imgEl = document.getElementById("editImg");

  if (document.getElementById("prevName"))
    document.getElementById("prevName").innerText = nameEl.value || "Community Name";
  if (document.getElementById("prevLocation"))
    document.getElementById("prevLocation").innerText = locEl.value || "Location";
  if (document.getElementById("prevDesc"))
    document.getElementById("prevDesc").innerText = descEl.value || "Description...";
  if (document.getElementById("prevPrice"))
    document.getElementById("prevPrice").innerText = (priceEl.value || "0") + " per month";
  if (document.getElementById("prevBadge"))
    document.getElementById("prevBadge").innerText = labelEl.value;

  const prevImg = document.getElementById("prevImg");
  if (imgEl && imgEl.value && prevImg) prevImg.src = imgEl.value;
}

async function saveChanges() {
  const userStr = localStorage.getItem("user");
  const user = JSON.parse(userStr);

  const checkedFacilities = Array.from(
    document.querySelectorAll(".facility-check:checked"),
  )
    .map((cb) => cb.value)
    .join(",");

  const data = {
    manager_id: user.id,
    name: document.getElementById("editName").value,
    location: document.getElementById("editLocation").value,
    description: document.getElementById("editDesc").value,
    pricing: document.getElementById("editPrice").value,
    price_range: document.getElementById("editPrice").value,
    price: document.getElementById("editPrice").value,
    phone: document.getElementById("editPhone").value,
    image_url: document.getElementById("editImg").value,
    specialty_label: document.getElementById("editLabel").value,
    facilities: checkedFacilities,
  };

  const commId = document.getElementById("communityId").value;

  try {
    let response;
    if (commId) {
      response = await fetch(`${API_URL}/communities/${commId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data),
      });
    } else {
      response = await fetch(`${API_URL}/communities/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data),
      });
    }

    if (response.ok) {
      const saved = await response.json();
      currentCommunity = saved;
      document.getElementById("communityId").value = saved.id;
      showToast("Changes saved successfully!");
    } else {
      throw new Error("Failed to save");
    }
  } catch (e) {
    console.error(e);
    showToast("Error saving changes.");
  }
}
