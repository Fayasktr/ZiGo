async function submitAddressFormForEditAddress() {
    const form = document.getElementById('addressForm');

    document.querySelectorAll('.error-msg').forEach(msg => msg.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.isDefault = form.querySelector('#isDefault').checked;

    let isValid = true;

    const nameRegex = /^[A-Za-z\s]{3,}$/;
    if (!nameRegex.test(data.userName)) {
        showError('userName');
        isValid = false;
    }

    if (!data.type) {
        showError('type');
        isValid = false;
    }

    if (data.detailedAddress.length < 10) {
        showError('detailedAddress');
        isValid = false;
    }

    const alphaRegex = /^[A-Za-z\s]+$/;
    if (!alphaRegex.test(data.country)) {
        showError('country');
        isValid = false;
    }

    if (!alphaRegex.test(data.city)) {
        showError('city');
        isValid = false;
    }

    const numRegex = /^\d+$/;
    if (!numRegex.test(data.pincode)) {
        showError('pincode');
        isValid = false;
    }

    if (!numRegex.test(data.phoneNumber)) {
        showError('phoneNumber');
        isValid = false;
    }

    if (!isValid) return;

    const id = data.id;
    const url = id ? `/user/addresses/${id}/edit` : '/user/addresses/add';
    const method = id ? 'PUT' : 'POST';

    try {
        Swal.fire({
            title: 'Saving...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: id ? 'Address updated successfully' : 'Address added successfully',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = '/user/addresses';
            });
        } else {
            throw new Error(result.message || 'Failed to save address');
        }
    } catch (error) {
        console.error('AJAX Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: error.message
        });
    }
}

function showError(fieldId) {
    const errorSpan = document.getElementById(`error-${fieldId}`);
    const input = document.getElementById(fieldId);
    if (errorSpan) errorSpan.style.display = 'block';
    if (input) input.classList.add('error');
}
