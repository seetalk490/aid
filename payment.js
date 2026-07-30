/* =====================================================================
   AL ISHARAH INSTITUTE FOR DEAF (AID) — Payment Page
   Front-end only. No payment is ever confirmed by this file.
   The server (and PhonePe's own servers) are the only source of
   truth for whether a payment succeeded — this script only displays
   whatever the backend tells it.
===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================================
     1. COURSE FEE TABLE
     Same table used on the registration page. In production this
     should be confirmed by the backend, not trusted from the client.
  ===================================================================== */
  const COURSE_FEES = {
    '9-english':  250, '10-english': 300, '11-english': 300, '12-english': 350,
    '9-tamil':    250, '10-tamil':   300, '11-tamil':   300, '12-tamil':   350,
  };

  // Maps class + medium to the student's dashboard route, e.g. 12th
  // English -> /12en/home, 10th Tamil -> /10ta/home.
  const DASHBOARD_ROUTES = {
    '9-english': '/9en/home',   '10-english': '/10en/home',
    '11-english': '/11en/home', '12-english': '/12en/home',
    '9-tamil': '/9ta/home',     '10-tamil': '/10ta/home',
    '11-tamil': '/11ta/home',   '12-tamil': '/12ta/home',
  };

  /* =====================================================================
     2. CURRENT STUDENT (placeholder)
     -------------------------------------------------------------------
     TODO (backend integration): replace this hardcoded object with the
     logged-in student's real record, e.g. fetched from:
       GET /api/student/me
     Never let the client decide its own class, medium or fee — always
     re-confirm these values against the backend before charging or
     granting access.
  ===================================================================== */
  const currentStudent = {
    name: 'Student Name',
    studentId: 'AID-000000',
    studentClass: '10',
    medium: 'english',
    schoolName: 'School Name',
    district: 'District',
    photoUrl: '', // optional — left blank to show the placeholder icon
    nextRenewalDate: getDefaultRenewalDate(),
  };

  function getDefaultRenewalDate() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return formatDate(d);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function courseKey(student) {
    return `${student.studentClass}-${student.medium}`;
  }

  function mediumLabel(medium) {
    return medium === 'english' ? 'English Medium' : 'Tamil Medium';
  }

  /* =====================================================================
     3. DOM REFERENCES
  ===================================================================== */
  const views = {
    payment: document.getElementById('paymentView'),
    processing: document.getElementById('processingView'),
    success: document.getElementById('successView'),
    failed: document.getElementById('failedView'),
  };

  const els = {
    studentPhoto: document.getElementById('studentPhoto'),
    studentName: document.getElementById('studentName'),
    studentId: document.getElementById('studentId'),
    studentClass: document.getElementById('studentClass'),
    studentMedium: document.getElementById('studentMedium'),
    studentSchool: document.getElementById('studentSchool'),
    studentDistrict: document.getElementById('studentDistrict'),

    planTag: document.getElementById('planTag'),
    planFee: document.getElementById('planFee'),
    subStatus: document.getElementById('subStatus'),
    renewalDate: document.getElementById('renewalDate'),

    payAmountLabel: document.getElementById('payAmountLabel'),
    payNowBtn: document.getElementById('payNowBtn'),

    historyTableBody: document.getElementById('historyTableBody'),

    txnId: document.getElementById('txnId'),
    txnAmount: document.getElementById('txnAmount'),
    txnDate: document.getElementById('txnDate'),
    txnRenewal: document.getElementById('txnRenewal'),

    goDashboardBtn: document.getElementById('goDashboardBtn'),
    downloadReceiptBtn: document.getElementById('downloadReceiptBtn'),
    retryPaymentBtn: document.getElementById('retryPaymentBtn'),
    contactAdminBtn: document.getElementById('contactAdminBtn'),
  };

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  }

  /* =====================================================================
     4. RENDER STUDENT + SUBSCRIPTION INFO
  ===================================================================== */
  function renderStudentInfo(student) {
    if (student.photoUrl) {
      els.studentPhoto.innerHTML = `<img src="${student.photoUrl}" alt="${student.name}'s photo">`;
    }
    els.studentName.textContent = student.name;
    els.studentId.textContent = `Student ID: ${student.studentId}`;
    els.studentClass.textContent = `${student.studentClass}th Standard`;
    els.studentMedium.textContent = mediumLabel(student.medium);
    els.studentSchool.textContent = student.schoolName;
    els.studentDistrict.textContent = student.district;
  }

  function renderSubscriptionInfo(student) {
    const fee = COURSE_FEES[courseKey(student)] || 0;
    els.planTag.textContent = `${student.studentClass}th ${mediumLabel(student.medium)}`;
    els.planFee.textContent = `₹${fee}`;
    els.renewalDate.textContent = student.nextRenewalDate;
    els.payAmountLabel.textContent = `₹${fee}`;
    return fee;
  }

  /* =====================================================================
     5. PAYMENT HISTORY (placeholder rendering)
     -------------------------------------------------------------------
     TODO (backend integration): replace with real history from
       GET /api/payment/history
  ===================================================================== */
  function renderHistory(rows) {
    if (!rows || rows.length === 0) {
      els.historyTableBody.innerHTML = `<tr class="empty-row"><td colspan="4">No payment history yet.</td></tr>`;
      return;
    }
    els.historyTableBody.innerHTML = rows.map(row => `
      <tr>
        <td>${row.date}</td>
        <td>${row.transactionId}</td>
        <td>₹${row.amount}</td>
        <td><span class="table-status ${row.status === 'Paid' ? 'paid' : 'failed'}">${row.status}</span></td>
      </tr>
    `).join('');
  }

  /* =====================================================================
     6. PHONEPE PAYMENT FLOW — placeholder functions
     -------------------------------------------------------------------
     Real flow (to implement once the backend is ready):
       1. startPayment() calls your backend, e.g.
            POST /api/payment/initiate  { studentId, courseKey }
          The backend creates a PhonePe order and returns a redirect URL.
       2. The browser is redirected to that PhonePe checkout URL.
       3. PhonePe redirects back to this page (or a dedicated callback
          route) with a transaction reference in the query string.
       4. verifyPayment() sends that reference to the backend, e.g.
            GET /api/payment/verify?txnId=...
          The backend calls PhonePe's server-to-server status API and
          returns a confirmed result — this is the ONLY trustworthy
          source of truth.
       5. Based on the backend's response, call paymentSuccess(data)
          or paymentFailed(data). Never call paymentSuccess() directly
          from client-side logic alone.
  ===================================================================== */

  let currentFee = 0;

  function startPayment() {
    els.payNowBtn.disabled = true;
    els.payNowBtn.querySelector('.btn-label').hidden = true;
    els.payNowBtn.querySelector('.btn-spinner').hidden = false;
    showView('processing');

    // ---------------------------------------------------------------
    // TODO: replace with a real call to your backend, e.g.:
    //
    // fetch('/api/payment/initiate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     studentId: currentStudent.studentId,
    //     courseKey: courseKey(currentStudent),
    //   }),
    // })
    //   .then(res => res.json())
    //   .then(data => {
    //     // data.redirectUrl is the PhonePe checkout page.
    //     window.location.href = data.redirectUrl;
    //   })
    //   .catch(() => paymentFailed({ reason: 'Could not start payment.' }));
    // ---------------------------------------------------------------

    console.log('startPayment() called — waiting for PhonePe backend integration.');

    // Without a backend connected yet, there is nothing further this
    // page can safely do. It stays on the processing view so it is
    // obvious the flow is intentionally paused here, not broken.
  }

  function verifyPayment(transactionId) {
    // ---------------------------------------------------------------
    // TODO: replace with a real call to your backend, e.g.:
    //
    // fetch(`/api/payment/verify?txnId=${encodeURIComponent(transactionId)}`)
    //   .then(res => res.json())
    //   .then(result => {
    //     if (result.status === 'SUCCESS') {
    //       paymentSuccess(result);
    //     } else {
    //       paymentFailed(result);
    //     }
    //   })
    //   .catch(() => paymentFailed({ reason: 'Could not verify payment.' }));
    // ---------------------------------------------------------------

    console.log('verifyPayment() called for transaction:', transactionId,
      '— connect this to the backend verification endpoint.');
  }

  function paymentSuccess(data) {
    // `data` is expected to come from the backend, shaped like:
    // { transactionId, amount, paymentDate, nextRenewalDate }
    els.txnId.textContent = data.transactionId || '—';
    els.txnAmount.textContent = data.amount ? `₹${data.amount}` : `₹${currentFee}`;
    els.txnDate.textContent = data.paymentDate || formatDate(new Date());
    els.txnRenewal.textContent = data.nextRenewalDate || currentStudent.nextRenewalDate;

    showView('success');
  }

  function paymentFailed(data) {
    console.warn('Payment failed:', data && data.reason ? data.reason : 'Unknown reason.');
    showView('failed');

    // Reset the Pay Now button for a retry.
    els.payNowBtn.disabled = false;
    els.payNowBtn.querySelector('.btn-label').hidden = false;
    els.payNowBtn.querySelector('.btn-spinner').hidden = true;
  }

  /* =====================================================================
     7. EVENT WIRING
  ===================================================================== */
  els.payNowBtn.addEventListener('click', startPayment);

  els.retryPaymentBtn.addEventListener('click', () => {
    showView('payment');
    els.payNowBtn.disabled = false;
    els.payNowBtn.querySelector('.btn-label').hidden = false;
    els.payNowBtn.querySelector('.btn-spinner').hidden = true;
  });

  els.contactAdminBtn.addEventListener('click', () => {
    // TODO: point this at a real support channel (mailto, WhatsApp, or
    // an in-app help form).
    window.location.href = 'mailto:support@aid-institute.example?subject=Payment%20Issue';
  });

  els.goDashboardBtn.addEventListener('click', () => {
    // IMPORTANT: this only navigates the browser. The dashboard route
    // itself must check the student's verified subscription status on
    // the server before showing any course content — a client-side
    // redirect is never sufficient to grant access.
    const route = DASHBOARD_ROUTES[courseKey(currentStudent)] || '/dashboard';
    window.location.href = route;
  });

  els.downloadReceiptBtn.addEventListener('click', () => {
    // Placeholder only — replace with a real request to the backend
    // for a generated PDF receipt, e.g. GET /api/payment/receipt/:txnId
    console.log('Download Receipt clicked — connect to backend receipt generation.');
    alert('Receipt download will be available once the backend is connected.');
  });

  /* =====================================================================
     8. INITIAL RENDER
  ===================================================================== */
  renderStudentInfo(currentStudent);
  currentFee = renderSubscriptionInfo(currentStudent);
  renderHistory([]); // Empty until backend history is wired in.

  // If the page was reached via a redirect back from the payment
  // gateway, it will include a transaction reference in the URL —
  // e.g. payment.html?txnId=ABC123. When present, verify it with the
  // backend instead of showing the payment form again.
  const params = new URLSearchParams(window.location.search);
  const returningTxnId = params.get('txnId');
  if (returningTxnId) {
    showView('processing');
    verifyPayment(returningTxnId);
  }
});
