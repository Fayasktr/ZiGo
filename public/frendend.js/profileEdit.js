async function updateProfile() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);

    document.querySelectorAll('.error-msg').forEach(msg => msg.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));

    let isValid = true;

    const userName = document.getElementById('userName').value.trim();
    if (userName.length <= 3) {
        showError('userName');
        isValid = false;
    }

    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showError('phone');
        isValid = false;
    }

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
            method: 'PUT',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            if (result.status === "otp_required") {
                Swal.fire({
                    icon: 'info',
                    title: 'Verification Needed',
                    text: result.message,
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/user/otp';
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: result.message || 'Profile updated successfully',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.reload();
                });
            }
        } else {
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

    document.querySelectorAll('.error-msg').forEach(msg => msg.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));

    let isValid = true;

    if (!data.currentPassword) {
        showError('currentPassword');
        isValid = false;
    }

    if (data.newPassword.length < 6) {
        showError('newPassword');
        isValid = false;
    }

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
