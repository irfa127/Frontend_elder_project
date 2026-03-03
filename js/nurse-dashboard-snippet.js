async function updateStatus(id, newStatus) {
    if (!confirm(`Update status to ${newStatus}?`)) return;
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ status: newStatus }),
        });
        if (response.ok) {
            showToast(`Status updated to ${newStatus}`);
            // Refresh page to see changes (or re-fetch)
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast("Failed to update status", "error");
        }
    } catch (e) {
        showToast("Connection error", "error");
    }
}

