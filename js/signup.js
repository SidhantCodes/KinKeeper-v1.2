function validateForm() {
    var firstName = document.getElementById('firstName').value.trim();
    var lastName = document.getElementById('lastName').value.trim();
    var email = document.getElementById('email').value.trim();
    var phoneNumber = document.getElementById('phoneNumber').value.trim();
    var gender = document.querySelector('input[name="gender"]:checked');
    var userID = document.getElementById('userID').value.trim();
    var password = document.getElementById('password').value.trim();
    var confirmPassword = document.getElementById('confirmPassword').value.trim();
    var dob = document.getElementById('dob').value;

    //Basic validation
    if (firstName === '' || lastName === '' || email === '' || phoneNumber === '' || !gender || userID === '' || password === '' || confirmPassword === '') {
        alert('All fields are required');
        return false;
    }

    //Name validation
    var namePattern = /^[a-zA-Z]+$/;
    if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
        alert('First and Last Name should contain only letters');
        return false;
    }

    //Email validation
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert('Invalid email address');
        return false;
    }

    //Phone number validation
    if (!(/^\d{10}$/.test(phoneNumber))) {
        alert('Phone number must have exactly 10 digits');
        return false;
    }

    //Date of Birth validation (optional)
    if (dob !== '') {
        var today = new Date();
        var selectedDate = new Date(dob);
        if (selectedDate > today) {
            alert('Date of Birth cannot be in the future');
            return false;
        }
    }

    //Password validation
    var passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordPattern.test(password)) {
        alert('Password must contain at least 1 letter, 1 number, 1 special character, and be at least 8 characters long');
        return false;
    }

    //Confirm password validation
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return false;
    }
    return true;
}