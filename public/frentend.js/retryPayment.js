/**
 * Centralized Razorpay Payment Retry logic for ZiGo
 */

async function retryPayment(orderId, phoneOrEvent, eventArg) {
    // Determine arguments based on how it's called
    // Pattern 1: retryPayment(orderId, event)
    // Pattern 2: retryPayment(orderId, phone, event)
    let phone = (typeof phoneOrEvent === 'string') ? phoneOrEvent : '';
    let event = (typeof phoneOrEvent === 'object') ? phoneOrEvent : eventArg;

    try {
        // UI: Manage button state
        let btn = null;
        if (event && (event.currentTarget || event.target)) {
            btn = event.currentTarget || event.target;
        } else {
            // Fallback: try to find button by orderId in onclick
            btn = document.querySelector(`[onclick*="${orderId}"]`);
        }

        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing...';
        }

        // 1. Get Razorpay Order Details
        const response = await fetch('/user/checkout/retry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Failed to initialize payment");

        // 2. Initialize Razorpay Modal
        const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: "ZiGo",
            description: "Order Payment Retry",
            order_id: data.orderId,
            handler: async function (response) {
                try {
                    // 3. Verify Payment on Success
                    const verifyRes = await fetch('/user/checkout/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: data.dbOrderId
                        })
                    });

                    const verifyResult = await verifyRes.json();
                    if (verifyResult.success) {
                        window.location.href = verifyResult.redirectUrl;
                    } else {
                        throw new Error(verifyResult.message || "Verification failed");
                    }
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Verification Failed',
                        text: err.message,
                        confirmButtonColor: '#EF4444'
                    });
                    
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                    }
                }
            },
            modal: {
                ondismiss: function() {
                    // Restore button state if user closes modal without paying
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                    }
                }
            },
            prefill: {
                contact: phone || ""
            },
            theme: { color: "#FF5A1F" }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Payment Error',
            text: error.message,
            confirmButtonColor: '#EF4444'
        });
        
        // Find button again to reset state if error occurred early
        const btn = (event && (event.currentTarget || event.target)) || document.querySelector(`[onclick*="${orderId}"]`);
        if (btn) {
            btn.disabled = false;
            // Restore content if possible, otherwise fallback to text
            if (btn.innerHTML.includes('fa-spinner')) {
                btn.innerHTML = 'Retry Payment';
            }
        }
    }
}
