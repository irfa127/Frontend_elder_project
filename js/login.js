 
initPage();
async function initPage() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("errorMessage");

            if (!email || !password) {
                errorDiv.textContent = "Please fill in all fields.";
                errorDiv.style.display = "block";
                return;
            }

            if (!email.includes("@") || !email.includes(".")) {
                errorDiv.textContent = "Please enter a valid email address.";
                errorDiv.style.display = "block";
                return;
            }

            errorDiv.style.display = "none";
            errorDiv.textContent = "";

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("user", JSON.stringify(data.user));

                    const role = data.user.role;
                    if (role === "patient") {
                        window.location.href = "patient-dashboard.html";
                    } else if (role === "nurse") {
                        window.location.href = "nurse-dashboard.html";
                    } else if (role === "oah_manager") {
                        window.location.href = "oah-dashboard.html";
                    }
                } else if (response.status == 401) {
                    let errorMessage = data.detail;
                    // if (data.detail) {
                    //     if (typeof data.detail === "string") {
                    //         errorMessage = data.detail;
                    //     } else if (Array.isArray(data.detail)) {
                    //         errorMessage = data.detail
                    //             .map((err) => err.msg || JSON.stringify(err))
                    //             .join(", ");
                    //     } else {
                    //         errorMessage = data.detail.message || JSON.stringify(data.detail);
                    //     }
                    // }
                    errorDiv.textContent = data.detail;
                    errorDiv.style.display = "block";
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = "block";
                console.error("Error:", error);
            }
        });
    }
}


