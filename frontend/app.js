const API = 'http://127.0.0.1:5000/api';
let isUpdating = false;
let initialized = false;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  if (initialized) return;
  initialized = true;
  
  loadPresets();
  loadSubscriptions();
  loadAlerts();
  updateWasteScore();
});

// ── LOAD PRESETS ──
async function loadPresets() {
  try {
    const res = await fetch(`${API}/presets`);
    const data = await res.json();
    const select = document.getElementById('presetSelect');

    const grouped = {};
    data.data.subscriptions.forEach(sub => {
      if (!grouped[sub.category]) grouped[sub.category] = [];
      grouped[sub.category].push(sub);
    });

    Object.entries(grouped).forEach(([category, subs]) => {
      const group = document.createElement('optgroup');
      group.label = category;
      subs.forEach(sub => {
        const option = document.createElement('option');
        option.value = JSON.stringify(sub);
        option.textContent = `${sub.name} — ₹${sub.price}/mo`;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  } catch (err) {
    console.error('Failed to load presets:', err);
  }
}

// ── FILL FROM PRESET ──
function fillFromPreset() {
  const select = document.getElementById('presetSelect');
  if (!select.value) return;
  const sub = JSON.parse(select.value);
  document.getElementById('subName').value = sub.name;
  document.getElementById('subCategory').value = sub.category;
  document.getElementById('subPrice').value = sub.price;
}

// ── LOAD SUBSCRIPTIONS ──
async function loadSubscriptions() {
  try {
    const res = await fetch(`${API}/subscriptions`);
    const data = await res.json();
    renderSubscriptions(data.data);
    document.getElementById('subCount').textContent = data.count;
  } catch (err) {
    console.error('Failed to load subscriptions:', err);
  }
}

// ── RENDER SUBSCRIPTIONS ──
function renderSubscriptions(subs) {
  const list = document.getElementById('subsList');

  if (!subs || subs.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-text">No subscriptions yet. Add one above to get your Waste Score!</div>
      </div>`;
    return;
  }

  list.innerHTML = subs.map(sub => `
    <div class="sub-card" id="sub-${sub.id}">
      <div class="sub-left">
        <div class="sub-icon">${getCategoryEmoji(sub.category)}</div>
        <div class="sub-info">
          <div class="sub-name">${sub.name}</div>
          <div class="sub-meta">${sub.category} · ${sub.renewal_date ? 'Renews ' + sub.renewal_date : 'No renewal date'}</div>
        </div>
      </div>
      <div class="sub-right">
        <div class="sub-price">₹${sub.price}/mo</div>
        <div class="sub-badge">${sub.category}</div>
        <button class="sub-delete" onclick="deleteSubscription(${sub.id})" title="Remove">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ── ADD SUBSCRIPTION ──
async function addSubscription() {
  const name = document.getElementById('subName').value.trim();
  const category = document.getElementById('subCategory').value;
  const price = document.getElementById('subPrice').value;
  const renewal = document.getElementById('subRenewal').value;

  if (!name || !price) {
    alert('Please enter a name and price.');
    return;
  }

  try {
    const res = await fetch(`${API}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category,
        price: parseFloat(price),
        renewal_date: renewal || null
      })
    });

    const data = await res.json();

    if (data.success) {
      // Clear form
      document.getElementById('subName').value = '';
      document.getElementById('subPrice').value = '';
      document.getElementById('subRenewal').value = '';
      document.getElementById('presetSelect').value = '';

      // Reload everything once
      loadSubscriptions();
      loadAlerts();
      updateWasteScore();
    }
  } catch (err) {
    console.error('Failed to add subscription:', err);
  }
}

// ── DELETE SUBSCRIPTION ──
async function deleteSubscription(id) {
  try {
    await fetch(`${API}/subscriptions/${id}`, { method: 'DELETE' });
    loadSubscriptions();
    loadAlerts();
    updateWasteScore();
  } catch (err) {
    console.error('Failed to delete subscription:', err);
  }
}

// ── UPDATE WASTE SCORE ──
async function updateWasteScore() {
  if (isUpdating) return;
  isUpdating = true;

  try {
    const res = await fetch(`${API}/waste-score`);
    const data = await res.json();
    const score = data.data;

    const scoreNum = document.getElementById('scoreNumber');
    scoreNum.textContent = score.score;
    scoreNum.className = `score-number ${score.color}`;
    document.getElementById('scoreVerdict').textContent = score.verdict;
    document.getElementById('totalMonthly').textContent = `₹${score.total_monthly}`;
    document.getElementById('wastedAmount').textContent = `₹${score.wasted_amount}`;
  } catch (err) {
    console.error('Failed to update waste score:', err);
  } finally {
    setTimeout(() => { isUpdating = false; }, 1000);
  }
}

// ── GET AI ADVICE ──
async function getAIAdvice() {
  const btn = document.getElementById('getAdviceBtn');
  const box = document.getElementById('adviceBox');
  const text = document.getElementById('adviceText');

  btn.textContent = '⏳ Thinking...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/ai-advice`);
    const data = await res.json();
    text.textContent = data.advice;
    box.classList.remove('hidden');
  } catch (err) {
    text.textContent = 'Could not get advice right now. Try again!';
    box.classList.remove('hidden');
  } finally {
    btn.textContent = '✨ Get AI Advice';
    btn.disabled = false;
  }
}

// ── LOAD ALERTS ──
async function loadAlerts() {
  try {
    const res = await fetch(`${API}/alerts`);
    const data = await res.json();
    const alerts = data.data;

    const section = document.getElementById('alertsSection');
    const list = document.getElementById('alertsList');

    if (alerts.total_upcoming === 0) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');
    list.innerHTML = alerts.upcoming_renewals.map(r => `
      <div class="alert-item ${r.urgency}">
        <div class="alert-left">
          <div class="alert-name">${r.name}</div>
          <div class="alert-days">${r.days_left === 0 ? 'Renews TODAY' : `Renews in ${r.days_left} day${r.days_left > 1 ? 's' : ''}`}</div>
        </div>
        <div class="alert-price">₹${r.price}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load alerts:', err);
  }
}

// ── HELPERS ──
function getCategoryEmoji(category) {
  const map = {
    'OTT': '📺', 'Music': '🎵', 'Mobile': '📱',
    'Cloud': '☁️', 'Fitness': '💪', 'Insurance': '🛡️',
    'SIP': '📈', 'EMI': '🏦', 'Productivity': '⚡',
    'AI Tools': '🤖', 'Finance': '💰'
  };
  return map[category] || '📦';
}