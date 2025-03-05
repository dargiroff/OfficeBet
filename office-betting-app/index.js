// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) {
        // Redirect to login page
        window.location.href = 'login.html';
    }
}); 