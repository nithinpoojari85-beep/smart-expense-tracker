/* app.js (updated) */
const selectors = {
  authContainer: '#authContainer',
  appContainer: '#appContainer',
  loginForm: '#loginForm',
  registerForm: '#registerForm',
  resetForm: '#resetForm',
  showRegisterBtn: '#showRegisterBtn',
  showLoginBtn: '#showLoginBtn',
  forgotPasswordBtn: '#forgotPasswordBtn',
  registerName: '#registerName',
  registerEmail: '#registerEmail',
  registerPassword: '#registerPassword',
  registerConfirm: '#registerConfirm',
  loginEmail: '#loginEmail',
  loginPassword: '#loginPassword',
  resetEmail: '#resetEmail',
  resetCode: '#resetCode',
  resetPassword: '#resetPassword',
  resetConfirm: '#resetConfirm',
  sendResetCodeBtn: '#sendResetCodeBtn',
  resetPasswordBtn: '#resetPasswordBtn',
  userDisplay: '#userDisplay',
  logoutBtn: '#logoutBtn',
  darkBtn: '#darkBtn',
  currentDate: '#currentDate',
  description: '#description',
  amount: '#amount',
  date: '#date',
  type: '#type',
  category: '#category',
  addTransactionBtn: '#addTransactionBtn',
  historyList: '#historyList',
  search: '#search',
  filter: '#filter',
  downloadCSVBtn: '#downloadCSVBtn',
  downloadPDFBtn: '#downloadPDFBtn',
  clearBtn: '#clearBtn',
  expenseChart: '#expenseChart',
  budget: '#budget',
  saveBudgetBtn: '#saveBudgetBtn',
  progressBar: '#progressBar',
  income: '#income',
  expense: '#expense',
  balance: '#balance',
  totalTransactions: '#totalTransactions',
  averageExpense: '#averageExpense',
  categoryAnalysis: '#categoryAnalysis'
};

let transactions = [];
let expenseChart = null;

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 20);
  setTimeout(() => toast.remove(), duration);
}

function showAuthToast(message, type='') {
  const toast = document.createElement('div');
  toast.className = `auth-toast ${type}`.trim();
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 20);
  setTimeout(() => toast.remove(), 3000);
}

async function sha256Hex(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAllUsers() {
  const raw = localStorage.getItem('users');
  return raw ? JSON.parse(raw) : {};
}
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function setCurrentUser(email) {
  localStorage.setItem('currentUser', email);
}
function getCurrentUser() {
  return localStorage.getItem('currentUser');
}
function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}

function txKey(user) { return `transactions_${user}`; }
function budgetKey(user) { return `budget_${user}`; }
function themeKey(user) { return `theme_${user}`; }

function showAuthPage() {
  const authContainer = $(selectors.authContainer);
  const appContainer = $(selectors.appContainer);
  if (authContainer) authContainer.style.display = 'flex';
  if (appContainer) appContainer.style.display = 'none';
  authContainer?.setAttribute('aria-hidden', 'false');
  appContainer?.setAttribute('aria-hidden', 'true');
  $(selectors.loginForm).style.display = 'block';
  $(selectors.registerForm).style.display = 'none';
  $(selectors.resetForm).style.display = 'none';
}

function showRegisterPage() {
  $(selectors.loginForm).style.display = 'none';
  $(selectors.registerForm).style.display = 'block';
  $(selectors.resetForm).style.display = 'none';
}

function showLoginPage() {
  $(selectors.loginForm).style.display = 'block';
  $(selectors.registerForm).style.display = 'none';
  $(selectors.resetForm).style.display = 'none';
}

function showResetPage() {
  $(selectors.loginForm).style.display = 'none';
  $(selectors.registerForm).style.display = 'none';
  $(selectors.resetForm).style.display = 'block';
}

function showAppPage() {
  const authContainer = $(selectors.authContainer);
  const appContainer = $(selectors.appContainer);
  if (authContainer) authContainer.style.display = 'none';
  if (appContainer) appContainer.style.display = 'block';
  authContainer?.setAttribute('aria-hidden', 'true');
  appContainer?.setAttribute('aria-hidden', 'false');
  const currentUser = getCurrentUser();
  const users = getAllUsers();
  if (currentUser && users[currentUser]) {
    const userDisplay = $(selectors.userDisplay);
    if (userDisplay) userDisplay.textContent = `👤 ${users[currentUser].name}`;
  }
  initializeApp();
}

async function handleRegister(e) {
  e.preventDefault();
  const name = $(selectors.registerName).value.trim();
  const email = $(selectors.registerEmail).value.trim().toLowerCase();
  const password = $(selectors.registerPassword).value;
  const confirm = $(selectors.registerConfirm).value;

  if (!name || !email || !password || !confirm) {
    showAuthToast('Please fill all fields', 'error'); return;
  }
  if (password.length < 6) { showAuthToast('Password must be at least 6 characters', 'error'); return; }
  if (password !== confirm) { showAuthToast('Passwords do not match', 'error'); return; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { showAuthToast('Invalid email', 'error'); return; }

  const users = getAllUsers();
  if (users[email]) { showAuthToast('Email already registered', 'error'); return; }

  const hashed = await sha256Hex(password);
  users[email] = { name, email, password: hashed, registeredAt: new Date().toISOString() };
  saveUsers(users);
  showAuthToast('Registration successful! Please login.', 'success');
  $(selectors.registerName).value = '';
  $(selectors.registerEmail).value = '';
  $(selectors.registerPassword).value = '';
  $(selectors.registerConfirm).value = '';
  // switch to login
  showLoginPage();
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $(selectors.loginEmail).value.trim().toLowerCase();
  const password = $(selectors.loginPassword).value;
  if (!email || !password) { showAuthToast('Please enter email and password', 'error'); return; }
  const users = getAllUsers();
  if (!users[email]) { showAuthToast('User not found. Please register first.', 'error'); return; }
  const hashed = await sha256Hex(password);
  if (users[email].password !== hashed) { showAuthToast('Invalid password', 'error'); return; }
  setCurrentUser(email);
  showAuthToast('Login successful!', 'success');
  $(selectors.loginEmail).value = '';
  $(selectors.loginPassword).value = '';
  setTimeout(() => showAppPage(), 300);
}

function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;
  clearCurrentUser();
  showAuthToast('Logged out successfully', 'success');
  setTimeout(() => location.reload(), 400);
}

function initializeApp() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const raw = localStorage.getItem(txKey(currentUser));
  transactions = raw ? JSON.parse(raw) : [];

  const dateInput = $(selectors.date);
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  if (!expenseChart) createChart();

  displayTransactions();
  applyThemeForCurrentUser();
  setupDateTime();
  populateBudgetInput();
}

function setupDateTime(){
  function update() {
    const now = new Date();
    const el = $(selectors.currentDate);
    if (el) el.textContent = now.toLocaleString();
  }
  update();
  setInterval(update, 1000);
}

function saveTransactions() {
  const currentUser = getCurrentUser();
  const key = currentUser ? txKey(currentUser) : 'transactions';
  localStorage.setItem(key, JSON.stringify(transactions));
}

function clearFormInputs() {
  ['description','amount','type','category'].forEach(id => {
    const el = $(selectors[id]);
    if (el) el.value = '';
  });
  const dateInput = $(selectors.date);
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function validateAndCreateTransaction() {
  const description = $(selectors.description).value?.trim() || '';
  const amountRaw = $(selectors.amount).value;
  const amount = Number(amountRaw);
  const date = $(selectors.date).value || '';
  const type = $(selectors.type).value || '';
  const category = $(selectors.category).value || '';

  if (!description || !date || !type || !category || !amount || amount <= 0) {
    showToast('Please fill all fields correctly'); return;
  }

  const tx = { id: Date.now(), description, amount, date, type, category };
  transactions.push(tx);
  saveTransactions();
  displayTransactions();
  clearFormInputs();
  showToast('Transaction added');
}

function displayTransactions() {
  const list = $(selectors.historyList);
  if (!list) return;
  list.innerHTML = '';

  let income = 0, expense = 0, expenseCount = 0;

  transactions.forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else { expense += tx.amount; expenseCount++; }

    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(tx.description)}</strong>
        <br>
        <small>📅 ${tx.date} | 📂 ${tx.category}</small>
        <br>
        <span>${tx.type === 'income' ? '💰 +' : '💸 -'} ₹${formatNumber(tx.amount)}</span>
      </div>
      <div>
        <button class="btn-edit" data-id="${tx.id}" aria-label="Edit transaction ${tx.description}">✏️</button>
        <button class="btn-delete" data-id="${tx.id}" aria-label="Delete transaction ${tx.description}">❌</button>
      </div>
    `;
    list.appendChild(li);
  });

  const balance = income - expense;
  const totalTransactions = transactions.length;
  const averageExpense = expenseCount === 0 ? 0 : expense / expenseCount;

  setTextSafe(selectors.income, '₹' + formatNumber(income));
  setTextSafe(selectors.expense, '₹' + formatNumber(expense));
  setTextSafe(selectors.balance, '₹' + formatNumber(balance));
  setTextSafe(selectors.totalTransactions, String(totalTransactions));
  setTextSafe(selectors.averageExpense, '₹' + averageExpense.toFixed(2));

  updateChart();
  updateBudgetProgress();
  updateCategoryAnalysis();
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

function setTextSafe(selector, text) {
  const el = $(selector);
  if (el) el.textContent = text;
}

function formatNumber(n) {
  return Number(n).toLocaleString(undefined, {maximumFractionDigits:2});
}

function deleteTransactionById(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => String(t.id) !== String(id));
  saveTransactions();
  displayTransactions();
}

function editTransactionById(id) {
  const tx = transactions.find(t => String(t.id) === String(id));
  if (!tx) return;
  const newDesc = prompt('Description', tx.description);
  if (newDesc === null) return;
  const newAmountRaw = prompt('Amount', tx.amount);
  if (newAmountRaw === null) return;
  const newAmount = Number(newAmountRaw);
  if (!newDesc.trim() || !newAmount || newAmount <= 0) { showToast('Invalid values'); return; }
  tx.description = newDesc.trim();
  tx.amount = newAmount;
  saveTransactions();
  displayTransactions();
  showToast('Transaction updated');
}

function applyFilter() {
  const value = $(selectors.filter).value;
  const items = $all('#historyList li');
  items.forEach((item, index) => {
    if (value === 'all') {
      item.style.display = 'flex';
    } else {
      const tx = transactions[index];
      item.style.display = (tx && tx.type === value) ? 'flex' : 'none';
    }
  });
}

function applySearch() {
  const value = $(selectors.search).value.toLowerCase();
  const items = $all('#historyList li');
  items.forEach(item => {
    item.style.display = item.innerText.toLowerCase().includes(value) ? 'flex' : 'none';
  });
}

function createChart() {
  const canvas = $(selectors.expenseChart);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income','Expense'],
      datasets: [{ data: [0,0], backgroundColor:['#06b6d4','#ef4444'], borderWidth:1 } ]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'bottom'} } }
  });
}

function updateChart() {
  if (!expenseChart) return;
  let income = 0, expense = 0;
  transactions.forEach(t => { if (t.type === 'income') income += t.amount; else expense += t.amount; });
  expenseChart.data.datasets[0].data = [income, expense];
  expenseChart.update();
}

function updateCategoryAnalysis() {
  const categoryData = {};
  const categoryEmojis = { 'Salary':'💼','Food':'🍔','Shopping':'🛒','Travel':'🚗','Bills':'💡','Entertainment':'🎬','Health':'🏥','Education':'📚','Others':'🎁' };
  transactions.forEach(t => {
    if (t.type === 'expense') {
      categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    }
  });

  const container = $(selectors.categoryAnalysis);
  if (!container) return;
  if (Object.keys(categoryData).length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px">No expense data yet.</p>';
    return;
  }
  const total = Object.values(categoryData).reduce((a,b)=>a+b,0);
  const sorted = Object.entries(categoryData).sort((a,b)=>b[1]-a[1]);
  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">';
  sorted.forEach(([cat,amt]) => {
    const emoji = categoryEmojis[cat]||'📊';
    const percent = total>0 ? ((amt/total)*100).toFixed(1) : '0.0';
    html += `<div style="padding:15px;border-radius:12px;border:1px solid rgba(99,102,241,0.12);text-align:center">
      <div style="font-size:24px;margin-bottom:8px">${emoji}</div>
      <div style="font-weight:700">${cat}</div>
      <div style="font-weight:700;color:var(--primary)">₹${Math.round(amt)}</div>
      <div style="color:var(--text-light)">${percent}%</div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function getBudget() {
  const user = getCurrentUser();
  return user ? Number(localStorage.getItem(budgetKey(user))) || 0 : 0;
}

function populateBudgetInput() {
  const el = $(selectors.budget);
  if (!el) return;
  const b = getBudget();
  el.value = b || '';
}

function saveBudget() {
  const user = getCurrentUser();
  if (!user) { showToast('No user'); return; }
  const el = $(selectors.budget);
  const val = el ? Number(el.value) : 0;
  localStorage.setItem(budgetKey(user), val);
  updateBudgetProgress();
  showToast('Budget saved');
}

function updateBudgetProgress() {
  const progress = $(selectors.progressBar);
  if (!progress) return;
  const budget = getBudget();
  const expense = transactions.reduce((s,t)=> t.type==='expense' ? s + t.amount : s, 0);
  let percent = budget > 0 ? Math.min((expense / budget) * 100, 100) : 0;
  progress.style.width = percent + '%';
  progress.setAttribute('aria-valuenow', String(Math.round(percent)));
  if (percent < 60) progress.style.background = "#4CAF50";
  else if (percent < 90) progress.style.background = "#FFC107";
  else progress.style.background = "#F44336";
}

function downloadCSV() {
  if (transactions.length === 0) { showToast('No transactions available'); return; }
  let csv = 'Description,Amount,Type,Category,Date\n';
  transactions.forEach(t => {
    const desc = String(t.description).replace(/"/g,'""');
    csv += `"${desc}",${t.amount},${t.type},${t.category},${t.date}\n`;
  });
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'transactions.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded');
}

function downloadPDF() {
  if (transactions.length === 0) { showToast('No transactions'); return; }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.setFontSize(18); pdf.text('Expense Tracker Report', 20, 20);
  let y = 35;
  transactions.forEach(t => {
    pdf.setFontSize(11);
    pdf.text(`${t.date} | ${t.description} | ${t.category} | ${t.type} | ₹${t.amount}`, 10, y);
    y += 8;
    if (y > 270) { pdf.addPage(); y = 20; }
  });
  pdf.save('Expense_Report.pdf');
  showToast('PDF downloaded');
}

function applyThemeForCurrentUser() {
  const currentUser = getCurrentUser();
  const key = currentUser ? themeKey(currentUser) : 'theme';
  const theme = localStorage.getItem(key) || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark');
    $(selectors.darkBtn).textContent = '☀️ Light Mode';
  } else {
    document.body.classList.remove('dark');
    $(selectors.darkBtn).textContent = '🌙 Dark Mode';
  }
}

function toggleTheme() {
  const currentUser = getCurrentUser();
  const key = currentUser ? themeKey(currentUser) : 'theme';
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(key, isDark ? 'dark' : 'light');
  $(selectors.darkBtn).textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

/* ----- Password Reset / Forgot Password Logic ----- */
function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

function sendResetCode(e) {
  e && e.preventDefault();
  const email = $(selectors.resetEmail).value.trim().toLowerCase();
  if (!email) { showAuthToast('Enter your registered email', 'error'); return; }
  const users = getAllUsers();
  if (!users[email]) { showAuthToast('No account found with that email', 'error'); return; }

  const code = generateResetCode();
  users[email].resetCode = String(code);
  users[email].resetExpires = Date.now() + (15 * 60 * 1000); // 15 minutes
  saveUsers(users);

  // Since this is a local app without email, show code in toast (simulate email)
  showAuthToast(`Reset code: ${code} (valid 15 minutes)`, 'success');

  // Reveal code/password fields in reset form if hidden
  $(selectors.resetCode).focus();
}

async function handleResetPassword(e) {
  e && e.preventDefault();
  const email = $(selectors.resetEmail).value.trim().toLowerCase();
  const code = $(selectors.resetCode).value.trim();
  const password = $(selectors.resetPassword).value;
  const confirm = $(selectors.resetConfirm).value;

  if (!email || !code || !password || !confirm) { showAuthToast('Please fill all reset fields', 'error'); return; }
  if (password.length < 6) { showAuthToast('Password must be at least 6 characters', 'error'); return; }
  if (password !== confirm) { showAuthToast('Passwords do not match', 'error'); return; }

  const users = getAllUsers();
  if (!users[email] || !users[email].resetCode) { showAuthToast('No reset requested or invalid email', 'error'); return; }

  if (String(users[email].resetCode) !== String(code)) { showAuthToast('Invalid reset code', 'error'); return; }
  if (Date.now() > (users[email].resetExpires || 0)) { showAuthToast('Reset code expired. Request a new one.', 'error'); return; }

  const hashed = await sha256Hex(password);
  users[email].password = hashed;
  delete users[email].resetCode;
  delete users[email].resetExpires;
  saveUsers(users);

  showAuthToast('Password reset successful! Please login.', 'success');
  // Reset form fields
  $(selectors.resetEmail).value = '';
  $(selectors.resetCode).value = '';
  $(selectors.resetPassword).value = '';
  $(selectors.resetConfirm).value = '';
  showLoginPage();
}
/* ----- End reset logic ----- */

function initEventHandlers() {
  $(selectors.showRegisterBtn)?.addEventListener('click', () => {
    showRegisterPage();
  });
  $(selectors.showLoginBtn)?.addEventListener('click', () => {
    showLoginPage();
  });

  $(selectors.registerForm)?.addEventListener('submit', handleRegister);
  $(selectors.loginForm)?.addEventListener('submit', handleLogin);
  $(selectors.logoutBtn)?.addEventListener('click', handleLogout);

  $(selectors.addTransactionBtn)?.addEventListener('click', validateAndCreateTransaction);
  $(selectors.saveBudgetBtn)?.addEventListener('click', saveBudget);
  $(selectors.downloadCSVBtn)?.addEventListener('click', downloadCSV);
  $(selectors.downloadPDFBtn)?.addEventListener('click', downloadPDF);
  $(selectors.clearBtn)?.addEventListener('click', () => {
    if (!confirm('Clear all transactions?')) return;
    transactions = []; saveTransactions(); displayTransactions(); showToast('All transactions cleared');
  });

  $(selectors.filter)?.addEventListener('change', applyFilter);
  $(selectors.search)?.addEventListener('input', applySearch);

  $(selectors.historyList)?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (btn.classList.contains('btn-delete')) deleteTransactionById(id);
    else if (btn.classList.contains('btn-edit')) editTransactionById(id);
  });

  $(selectors.darkBtn)?.addEventListener('click', toggleTheme);

  // Reset / forgot password handlers
  $(selectors.forgotPasswordBtn)?.addEventListener('click', (e) => {
    e.preventDefault();
    showResetPage();
  });
  $(selectors.sendResetCodeBtn)?.addEventListener('click', sendResetCode);
  $(selectors.resetPasswordBtn)?.addEventListener('click', handleResetPassword);
}

function boot() {
  initEventHandlers();
  // initial view
  const currentUser = getCurrentUser();
  if (currentUser) {
    showAppPage();
  } else {
    showAuthPage();
  }
}

document.addEventListener('DOMContentLoaded', boot);

window.app = {
  _transactions: () => transactions.slice(),
  logout: handleLogout,
  toggleTheme
};