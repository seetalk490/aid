/* =====================================================================
   AIDEAF TN — Student Registration
   Front-end only. Replace the marked sections with real API calls
   (Google OAuth + your backend's /register endpoint) when ready.
===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================================
     1. COURSE DATA
     Single source of truth: class + medium -> subjects + monthly fee.
     Students never pick subjects directly — this table decides them.
  ===================================================================== */
  const COURSES = {
    '9-english':  { subjects: ['English', 'Maths', 'Science', 'Social Science'], fee: 250 },
    '10-english': { subjects: ['English', 'Maths', 'Science', 'Social Science'], fee: 300 },
    '11-english': { subjects: ['English', 'Economics', 'Accountancy', 'Commerce'], fee: 300 },
    '12-english': { subjects: ['English', 'Economics', 'Accountancy', 'Commerce'], fee: 350 },
    '9-tamil':    { subjects: ['Tamil', 'Maths', 'Science', 'Social Science'], fee: 250 },
    '10-tamil':   { subjects: ['Tamil', 'Maths', 'Science', 'Social Science'], fee: 300 },
    '11-tamil':   { subjects: ['Tamil', 'Economics', 'Accountancy', 'Commerce'], fee: 300 },
    '12-tamil':   { subjects: ['Tamil', 'Economics', 'Accountancy', 'Commerce'], fee: 350 },
  };

  const classSelect   = document.getElementById('studentClass');
  const mediumSelect  = document.getElementById('medium');

  const courseBox     = document.getElementById('courseBox');
  const courseEmpty   = document.getElementById('courseEmpty');
  const courseFilled  = document.getElementById('courseFilled');
  const courseTag     = document.getElementById('courseTag');
  const subjectList   = document.getElementById('subjectList');
  const courseFee     = document.getElementById('courseFee');

  function updateCourseBox() {
    const cls = classSelect.value;
    const medium = mediumSelect.value;

    if (!cls || !medium) {
      courseBox.classList.remove('filled');
      courseEmpty.hidden = false;
      courseFilled.hidden = true;
      return;
    }

    const key = `${cls}-${medium}`;
    const course = COURSES[key];
    if (!course) return;

    const mediumLabel = medium === 'english' ? 'English Medium' : 'Tamil Medium';
    courseTag.textContent = `${cls}th Standard · ${mediumLabel}`;

    subjectList.innerHTML = '';
    course.subjects.forEach(subject => {
      const li = document.createElement('li');
      li.textContent = subject;
      subjectList.appendChild(li);
    });

    courseFee.textContent = `₹${course.fee} / Month`;

    courseBox.classList.add('filled');
    courseEmpty.hidden = true;
    courseFilled.hidden = false;
  }

  classSelect.addEventListener('change', updateCourseBox);
  mediumSelect.addEventListener('change', updateCourseBox);

  /* =====================================================================
     2. SHOW / HIDE PASSWORD
  ===================================================================== */
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });

  /* =====================================================================
     3. GOOGLE SIGN UP (placeholder — wire up real OAuth later)
  ===================================================================== */
  document.getElementById('googleBtn').addEventListener('click', () => {
    // TODO: replace with real Google OAuth sign-up flow.
    alert('Google Sign Up will be connected here once backend authentication is ready.');
  });

  /* =====================================================================
     4. FORM VALIDATION + SUBMIT
  ===================================================================== */
  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnLabel = submitBtn.querySelector('.btn-label');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const successMsg = document.getElementById('successMsg');

  function setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const msg = document.querySelector(`.error-msg[data-for="${fieldId}"]`);
    if (input) input.classList.toggle('invalid', Boolean(message));
    if (msg) msg.textContent = message || '';
  }

  function validateForm() {
    let isValid = true;

    const fullName = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const studentClass = classSelect.value;
    const medium = mediumSelect.value;
    const schoolName = document.getElementById('schoolName').value.trim();
    const district = document.getElementById('district').value.trim();
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Clear previous errors first
    ['fullName','mobile','email','password','confirmPassword','studentClass','medium','schoolName','district','agreeTerms']
      .forEach(id => setError(id, ''));

    if (!fullName) { setError('fullName', 'Please enter the student\'s full name.'); isValid = false; }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('mobile', 'Enter a valid 10-digit mobile number.'); isValid = false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email', 'Enter a valid email address.'); isValid = false;
    }

    if (password.length < 6) { setError('password', 'Password must be at least 6 characters.'); isValid = false; }

    if (confirmPassword !== password || !confirmPassword) {
      setError('confirmPassword', 'Passwords do not match.'); isValid = false;
    }

    if (!studentClass) { setError('studentClass', 'Please select a class.'); isValid = false; }
    if (!medium) { setError('medium', 'Please select a medium.'); isValid = false; }
    if (!schoolName) { setError('schoolName', 'Please enter your school name.'); isValid = false; }
    if (!district) { setError('district', 'Please enter your district.'); isValid = false; }
    if (!agreeTerms) { setError('agreeTerms', 'You must agree to the Terms and Conditions.'); isValid = false; }

    return isValid;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateForm()) {
      // Focus the first invalid field for easy correction.
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Collect form data — ready to send to a real backend.
    const studentClass = classSelect.value;
    const medium = mediumSelect.value;
    const formData = {
      fullName: document.getElementById('fullName').value.trim(),
      mobile: document.getElementById('mobile').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      studentClass,
      medium,
      schoolName: document.getElementById('schoolName').value.trim(),
      district: document.getElementById('district').value.trim(),
      course: COURSES[`${studentClass}-${medium}`],
    };

    // Show loading state on the button.
    submitBtn.disabled = true;
    btnLabel.hidden = true;
    btnSpinner.hidden = false;

    // ---------------------------------------------------------------
    // TODO: replace this simulated delay with a real API call, e.g.:
    //
    // fetch('/api/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // })
    //   .then(res => res.json())
    //   .then(() => { window.location.href = '/payment'; })
    //   .catch(() => { /* show an error message */ });
    // ---------------------------------------------------------------
    setTimeout(() => {
      submitBtn.hidden = true;
      successMsg.hidden = false;

      setTimeout(() => {
        window.location.href = 'https://aideaftn.edu/payment';
      }, 1800);
    }, 1200);

    console.log('Registration data ready for backend:', formData);
  });

  // Live-clear an error as soon as the student fixes that field.
  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => setError(el.id, ''));
    el.addEventListener('change', () => setError(el.id, ''));
  });
});
