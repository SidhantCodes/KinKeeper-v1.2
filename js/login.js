function validateForm() {
    var userID = document.getElementById('userID').value.trim();
    var password = document.getElementById('password').value.trim();

    if (userID === '' || password === '') {
        alert('User ID and Password are required');
        return false;
    }
    return true;
}