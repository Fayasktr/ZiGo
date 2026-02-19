async function updateProfile() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);

    // Reset errors
    document.querySelectorAll('.error-msg').forEach(msg => msg.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));

    let isValid = true;

    // 1. Username Validation (> 3 chars)
    const userName = document.getElementById('userName').value.trim();
    if (userName.length <= 3) {
        showError('userName');
        isValid = false;
    }

    // 2. Phone Validation (Numeric)
    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^[0-9]{10}$/; // Assuming 10 digits
    if (!phoneRegex.test(phone)) {
        showError('phone');
        isValid = false;
    }

    // 3. Email Validation (if visible/editable)
    const emailInput = document.getElementById('email');
    if (emailInput) {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('email');
            isValid = false;
        }
    }

    if (!isValid) return;

    try {
        Swal.fire({
            title: 'Updating Profile...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch('/user/profile/edit', {
            method: 'POST',
            body: formData // Use FormData for multipart/form-data (image)
        });

        // If the controller doesn't send JSON, we handle the status
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile updated successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        } else {
            const result = await response.json().catch(() => ({ message: 'Update failed' }));
            throw new Error(result.message || 'Failed to update profile');
        }
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

async function updatePassword() {
    const form = document.getElementById('passwordForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Reset errors
    document.querySelectorAll('.error-msg').forEach(msg => msg.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));

    let isValid = true;

    // 1. Current Password Validation
    if (!data.currentPassword) {
        showError('currentPassword');
        isValid = false;
    }

    // 2. New Password Validation (> 6 digits/chars)
    if (data.newPassword.length < 6) {
        showError('newPassword');
        isValid = false;
    }

    // 3. Confirm Password Match
    if (data.newPassword !== data.confirmPassword) {
        showError('confirmPassword');
        isValid = false;
    }

    if (!isValid) return;

    try {
        Swal.fire({
            title: 'Updating Password...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch('/user/profile/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Password Changed!',
                text: 'Your security settings have been updated.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        } else {
            const result = await response.json().catch(() => ({ message: 'Incorrect current password' }));
            throw new Error(result.message || 'Failed to update password');
        }
    } catch (error) {
        Swal.fire('Oops!', error.message, 'error');
    }
}

function showError(fieldId) {
    const errorSpan = document.getElementById(`error-${fieldId}`);
    const input = document.getElementById(fieldId);
    if (errorSpan) errorSpan.style.display = 'block';
    if (input) input.classList.add('error');
}
