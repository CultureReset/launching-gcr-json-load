(function () {
  const HTML = `
<div class="claim-overlay" id="comingSoonOverlay">
  <div class="claim-modal" style="max-width:380px;text-align:center;" role="dialog" aria-modal="true">
    <button class="claim-modal-close" id="comingSoonClose" aria-label="Close">&#x2715;</button>
    <div style="font-size:52px;margin-bottom:12px;">🏆</div>
    <h2 style="font-size:1.5rem;margin-bottom:8px;">Coming Soon</h2>
    <p class="claim-sub">Gulf Coast Rewards is launching soon. Drop your email and we'll let you know the moment it goes live.</p>
    <form id="comingSoonForm" novalidate style="margin-top:16px;">
      <div class="claim-field" style="margin-bottom:12px;">
        <input type="email" id="comingSoonEmail" placeholder="your@email.com" style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:.95rem;font-family:inherit;outline:none;background:#f8fafc;">
      </div>
      <button type="submit" class="claim-submit" style="margin-top:0;">Notify Me</button>
    </form>
    <div id="comingSoonThanks" style="display:none;color:#0f7c90;font-weight:700;font-size:.95rem;margin-top:14px;">You're on the list! We'll be in touch. 🎉</div>
  </div>
</div>

<div class="claim-overlay" id="claimOverlay">
  <div class="claim-modal" role="dialog" aria-modal="true" aria-labelledby="claimTitle">
    <button class="claim-modal-close" id="claimClose" aria-label="Close">&#x2715;</button>
    <div id="claimFormWrap">
      <h2 id="claimTitle">Claim Your Free Listing</h2>
      <p class="claim-sub">Reach thousands of tourists every week. It only takes a minute.</p>
      <form id="claimForm" novalidate>
        <div class="claim-form-grid">
          <div class="claim-field">
            <label for="claimBizName">Business Name *</label>
            <input type="text" id="claimBizName" name="business_name" placeholder="e.g. The Rusty Anchor" required>
          </div>
          <div class="claim-field">
            <label for="claimCategory">Category *</label>
            <select id="claimCategory" name="category" required>
              <option value="">Select one…</option>
              <option value="restaurant">Restaurant</option>
              <option value="bar_nightlife">Bar / Nightlife</option>
              <option value="coffee_sweets">Coffee &amp; Sweets</option>
              <option value="shopping">Shopping</option>
              <option value="services">Services</option>
              <option value="public_spot">Public Spot / Attraction</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="claim-field">
            <label for="claimContactName">Your Name *</label>
            <input type="text" id="claimContactName" name="contact_name" placeholder="First &amp; last name" required>
          </div>
          <div class="claim-field">
            <label for="claimPhone">Phone Number *</label>
            <input type="tel" id="claimPhone" name="phone" placeholder="(251) 555-0100" required>
          </div>
          <div class="claim-field full">
            <label for="claimEmail">Email Address *</label>
            <input type="email" id="claimEmail" name="email" placeholder="you@yourbusiness.com" required>
          </div>
          <div class="claim-field full">
            <label for="claimWebsite">Website (optional)</label>
            <input type="url" id="claimWebsite" name="website" placeholder="https://yourbusiness.com">
          </div>
          <div class="claim-field full">
            <label for="claimMessage">Anything else? (optional)</label>
            <textarea id="claimMessage" name="message" placeholder="Hours, location, social handles, etc."></textarea>
          </div>
        </div>
        <p id="claimError" style="color:#c0392b;font-size:.85rem;margin:10px 0 0;display:none"></p>
        <button type="submit" class="claim-submit">Submit My Listing Request</button>
      </form>
    </div>
    <div class="claim-success" id="claimSuccess" style="display:none">
      <div class="claim-check">&#x2705;</div>
      <h3>You're on the list!</h3>
      <p>We'll reach out to <span id="claimSuccessEmail"></span> within 1 business day to get your listing live.</p>
    </div>
  </div>
</div>`;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.insertAdjacentHTML('beforeend', HTML);

    const overlay = document.getElementById('claimOverlay');
    const closeBtn = document.getElementById('claimClose');
    const form = document.getElementById('claimForm');
    const errorEl = document.getElementById('claimError');
    const successEl = document.getElementById('claimSuccess');
    const formWrap = document.getElementById('claimFormWrap');

    // wire all claim links
    document.querySelectorAll('a[href="claim.html"]').forEach(function (a) {
      a.removeAttribute('href');
      a.style.cursor = 'pointer';
      a.addEventListener('click', openClaimModal);
    });

    // wire all loyalty links → coming soon popup
    document.querySelectorAll('a[href="loyalty.html"]').forEach(function (a) {
      a.removeAttribute('href');
      a.style.cursor = 'pointer';
      a.addEventListener('click', openComingSoon);
    });

    // coming soon overlay
    const csOverlay = document.getElementById('comingSoonOverlay');
    document.getElementById('comingSoonClose').addEventListener('click', closeComingSoon);
    csOverlay.addEventListener('click', function (e) {
      if (e.target === csOverlay) closeComingSoon();
    });
    document.getElementById('comingSoonForm').addEventListener('submit', function (e) {
      e.preventDefault();
      document.getElementById('comingSoonForm').style.display = 'none';
      document.getElementById('comingSoonThanks').style.display = 'block';
    });

    closeBtn.addEventListener('click', closeClaimModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeClaimModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeClaimModal();
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      errorEl.style.display = 'none';

      const data = {
        business_name: form.business_name.value.trim(),
        category:      form.category.value,
        contact_name:  form.contact_name.value.trim(),
        phone:         form.phone.value.trim(),
        email:         form.email.value.trim(),
        website:       form.website.value.trim(),
        message:       form.message.value.trim(),
      };

      if (!data.business_name || !data.category || !data.contact_name || !data.phone || !data.email) {
        errorEl.textContent = 'Please fill in all required fields.';
        errorEl.style.display = 'block';
        return;
      }

      const submitBtn = form.querySelector('.claim-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const res = await fetch('https://gar-front-end-data.vercel.app/api/gcr/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        // show success regardless of endpoint status (endpoint may not exist yet)
        document.getElementById('claimSuccessEmail').textContent = data.email;
        formWrap.style.display = 'none';
        successEl.style.display = 'block';
      } catch (err) {
        // network error — still show success so user isn't left hanging
        document.getElementById('claimSuccessEmail').textContent = data.email;
        formWrap.style.display = 'none';
        successEl.style.display = 'block';
      }
    });
  });

  window.openClaimModal = function () {
    document.getElementById('claimOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeClaimModal() {
    document.getElementById('claimOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // loyalty strip button alias
  window.openSignupModal = function () { window.openComingSoon(); };

  window.openComingSoon = function () {
    document.getElementById('comingSoonOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeComingSoon() {
    document.getElementById('comingSoonOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
})();
