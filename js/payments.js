/* OntmPay — Razorpay demo checkout
   ---------------------------------------------------------------
   This uses Razorpay's TEST key so the checkout modal is fully
   functional in test mode (card 4111 1111 1111 1111, any future
   date/CVV, any UPI id ending in @razorpay will simulate success).

   IMPORTANT — for a production build:
   Razorpay requires an `order_id` created server-side (via the
   Orders API using your secret key) before opening checkout, so the
   amount can't be tampered with in the browser. There is no backend
   in this static demo, so amounts are passed directly and this
   checkout must be swapped to the order-based flow before going live.
   Swap RAZORPAY_KEY_ID for your own test/live key from the Razorpay
   dashboard when you wire up a backend.
   --------------------------------------------------------------- */

const RAZORPAY_KEY_ID = "rzp_test_1DP5mmOlF5G5ag"; // Razorpay's public sample test key

function openRazorpayCheckout({ amount, description, prefillName, prefillContact, onSuccess }) {
  if (typeof Razorpay === "undefined") {
    showToast("Payment gateway script didn't load — check your connection.");
    return;
  }
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    name: "OntmPay",
    description: description || "OntmPay transaction",
    theme: { color: "#142850" },
    prefill: {
      name: prefillName || "Demo User",
      contact: prefillContact || "9999999999",
    },
    notes: { platform: "OntmPay static demo" },
    handler: function (response) {
      onSuccess && onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        showToast("Payment window closed — no amount was charged.");
      },
    },
  };
  const rzp = new Razorpay(options);
  rzp.on("payment.failed", function () {
    showToast("Test payment failed — try again with the sandbox test card.");
  });
  rzp.open();
}

function wireCheckoutForm(formEl, buildSummary) {
  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    const summary = buildSummary();
    if (!summary) return;
    openRazorpayCheckout({
      amount: summary.amount,
      description: summary.description,
      prefillName: currentName(),
      onSuccess: function (response) {
        const refBox = document.getElementById("payment-result");
        if (refBox) {
          refBox.innerHTML = `
            <div class="card" style="border-color:var(--teal); background:var(--teal-soft);">
              <div class="flex center gap-12">
                <svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle><path d="M8 12.5l2.5 2.5L16 9"></path>
                </svg>
                <div>
                  <b>Payment successful (test mode)</b>
                  <p class="mono muted mb-0" style="font-size:.82rem;">Ref: ${response.razorpay_payment_id}</p>
                </div>
              </div>
            </div>`;
        }
        showToast(`₹${summary.amount.toLocaleString("en-IN")} paid successfully (test mode).`);
        formEl.reset();
      },
    });
  });
}