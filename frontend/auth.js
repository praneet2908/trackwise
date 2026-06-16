// ═══════════════════════════════════════════════════════════
//  TRACKWISE AI — SUPABASE AUTH + CLOUD SYNC
//  Magic link login. Data syncs to cloud per user.
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://aekvhxvlbfvboywyhorm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1apOlOaRY0DZoTLGi8ja0Q_ntJacVua';

// Load Supabase client
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// ── AUTH STATE LISTENER ──────────────────────────────────
// Fires whenever user logs in or out
sb.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    console.log('Logged in:', currentUser.email);
    onUserLoggedIn();
  } else {
    currentUser = null;
    onUserLoggedOut();
  }
});

// ── LOGIN WITH MAGIC LINK ────────────────────────────────
async function loginWithEmail(email) {
  const btn = document.getElementById('loginBtn');
  const msg = document.getElementById('loginMsg');
  
  btn.textContent = '⏳ Sending...';
  btn.disabled = true;

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'https://trackwise-in.netlify.app'
    }
  });

  if (error) {
    msg.textContent = '❌ Error: ' + error.message;
    msg.style.color = 'var(--red)';
  } else {
    msg.textContent = '✅ Magic link sent! Check your email and click the link.';
    msg.style.color = 'var(--green)';
  }

  btn.textContent = '✨ Send Magic Link';
  btn.disabled = false;
}

// ── LOGOUT ───────────────────────────────────────────────
async function logout() {
  await sb.auth.signOut();
  showToast('👋 Logged out successfully');
}

// ── SYNC DATA TO CLOUD ───────────────────────────────────
// Called after every data change — saves to Supabase
async function syncToCloud() {
  if (!currentUser) return;

  const data = {
    subscriptions: loadSubs(),
    budget:        loadBudget(),
    retention:     loadRetention(),
    kept:          loadKept(),
    mode:          getMode(),
    theme:         localStorage.getItem(THEME_KEY),
    lesson_index:  localStorage.getItem('tw_lesson_index'),
    updated_at:    new Date().toISOString()
  };

  const { error } = await sb
    .from('user_data')
    .upsert({
      user_id:  currentUser.id,
      email:    currentUser.email,
      data:     data
    }, { onConflict: 'user_id' });

  if (error) console.log('Sync error:', error.message);
  else console.log('✅ Synced to cloud');
}

// ── LOAD DATA FROM CLOUD ─────────────────────────────────
// Called on login — restores all user data
async function loadFromCloud() {
  if (!currentUser) return;

  const { data, error } = await sb
    .from('user_data')
    .select('data')
    .eq('user_id', currentUser.id)
    .single();

  if (error || !data) {
    console.log('No cloud data found — fresh start');
    return;
  }

  const d = data.data;

  // Restore everything to localStorage
  if (d.subscriptions) saveSubs(d.subscriptions);
  if (d.budget)        saveBudget(d.budget);
  if (d.retention)     saveRetention(d.retention);
  if (d.kept)          saveKept(d.kept);
  if (d.mode)          saveMode(d.mode);
  if (d.theme)         localStorage.setItem(THEME_KEY, d.theme);
  if (d.lesson_index)  localStorage.setItem('tw_lesson_index', d.lesson_index);

  console.log('✅ Data restored from cloud');
  showToast('✅ Your data has been restored!');
}

// ── ON LOGIN ─────────────────────────────────────────────
async function onUserLoggedIn() {
  // Hide login screen
  document.getElementById('login-screen').classList.add('hidden');
  
  // Update header
  updateAuthHeader();

  // Load cloud data first
  await loadFromCloud();

  // Then init app
  initApp();
}

// ── ON LOGOUT ────────────────────────────────────────────
function onUserLoggedOut() {
  // Show login screen
  document.getElementById('login-screen').classList.remove('hidden');
  
  // Update header
  updateAuthHeader();
}

// ── UPDATE HEADER ────────────────────────────────────────
function updateAuthHeader() {
  const btn = document.getElementById('authBtn');
  if (!btn) return;
  if (currentUser) {
    btn.textContent = '👤 ' + currentUser.email.split('@')[0];
    btn.onclick = () => {
      if (confirm('Log out?')) logout();
    };
  } else {
    btn.textContent = '🔑 Login';
    btn.onclick = () => {
      document.getElementById('login-screen').classList.remove('hidden');
    };
  }
}

// ── AUTO SYNC ON DATA CHANGE ─────────────────────────────
// Wrap saveSubs, saveBudget etc to auto sync
const _saveSubs = saveSubs;
window.saveSubs = function(subs) {
  _saveSubs(subs);
  syncToCloud();
};

const _saveBudget = saveBudget;
window.saveBudget = function(b) {
  _saveBudget(b);
  syncToCloud();
};

const _saveRetention = saveRetention;
window.saveRetention = function(s) {
  _saveRetention(s);
  syncToCloud();
};
