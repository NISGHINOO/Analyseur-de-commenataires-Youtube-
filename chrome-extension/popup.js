const API_URL = 'http://172.20.10.4:7860';
let currentFilter = 'all';
let analysisData = null;
let sentimentChart = null;

// Elements
const elements = {
  initialState: document.getElementById('initialState'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  resultsState: document.getElementById('resultsState'),
  
  analyzeBtn: document.getElementById('analyzeBtn'),
  retryBtn: document.getElementById('retryBtn'),
  newAnalysisBtn: document.getElementById('newAnalysisBtn'),
  toggleTheme: document.getElementById('themeToggle'),
  copyBtn: document.getElementById('copyBtn'),
  
  totalCount: document.getElementById('totalCount'),
  harassmentCount: document.getElementById('harassmentCount'),
  safeCount: document.getElementById('safeCount'),
  riskPercentage: document.getElementById('riskPercentage'),
  
  badgeAll: document.getElementById('badgeAll'),
  badgeHarassment: document.getElementById('badgeHarassment'),
  badgeSafe: document.getElementById('badgeSafe'),
  
  loadingText: document.getElementById('loadingText'),
  errorMessage: document.getElementById('errorMessage'),
  commentsList: document.getElementById('commentsList'),
  progressFill: document.getElementById('progressFill'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  attachEventListeners();
  checkAPIHealth();
});

// Theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (theme === 'dark') { 
    sunIcon?.classList.add('hidden'); 
    moonIcon?.classList.remove('hidden'); 
  } else { 
    sunIcon?.classList.remove('hidden'); 
    moonIcon?.classList.add('hidden'); 
  }
}

// Event listeners
function attachEventListeners() {
  elements.analyzeBtn?.addEventListener('click', startAnalysis);
  elements.retryBtn?.addEventListener('click', startAnalysis);
  elements.newAnalysisBtn?.addEventListener('click', resetToInitial);
  elements.toggleTheme?.addEventListener('click', toggleTheme);
  elements.copyBtn?.addEventListener('click', copyResults);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.getAttribute('data-filter')));
  });
}

// State management
function showState(state) {
  ['initial', 'loading', 'error', 'results'].forEach(s => {
    document.getElementById(`${s}State`)?.classList.toggle('hidden', s !== state);
  });
}

function resetToInitial() {
  showState('initial');
  analysisData = null;
  if (sentimentChart) {
    sentimentChart.destroy();
    sentimentChart = null;
  }
}

// API Health
async function checkAPIHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) return true;
  } catch(e) { 
    console.warn('API health failed:', e.message);
  }
  return false;
}

function updateLoadingText(text) {
  if (elements.loadingText) {
    elements.loadingText.textContent = text;
  }
}

// Main analysis
async function startAnalysis() {
  try {
    showState('loading');
    updateLoadingText('Vérification de la page YouTube...');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url?.includes('youtube.com/watch')) {
      throw new Error('Ouvre une vidéo YouTube.');
    }
    
    updateLoadingText('Extraction des commentaires...');
    const comments = await extractComments(tab.id);
    if (!comments?.length) {
      throw new Error('Aucun commentaire trouvé.');
    }
    
    updateLoadingText(`Analyse de ${comments.length} commentaire${comments.length > 1 ? 's' : ''}...`);
    const results = await analyzeComments(comments);
    
    analysisData = results;
    displayResults(results);
    showState('results');
    showToast(`${results.statistics.total_comments} commentaires analysés !`);
  } catch(err) { 
    showError(err.message); 
  }
}

// Extract comments
async function extractComments(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const comments = [...document.querySelectorAll('#content-text')]
          .map(el => el.textContent?.trim())
          .filter(t => t);
        return comments;
      }
    }, res => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(res?.[0]?.result || []);
      }
    });
  });
}

// Analyze comments via API
async function analyzeComments(comments) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const res = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments }),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);
  
  if (!res.ok) { 
    const err = await res.json().catch(() => ({})); 
    throw new Error(err.detail || `Erreur API: ${res.status}`);
  }
  
  const data = await res.json();
  
  if (!data.predictions || !data.statistics) {
    throw new Error('Format réponse invalide');
  }
  
  return data;
}

// Display results
function displayResults(data) {
  const { predictions, statistics } = data;
  
  animateValue(elements.totalCount, 0, statistics.total_comments, 800);
  animateValue(elements.harassmentCount, 0, statistics.harassment_detected, 800);
  animateValue(elements.safeCount, 0, statistics.total_comments - statistics.harassment_detected, 800);
  
  elements.riskPercentage.textContent = `${statistics.harassment_percentage.toFixed(1)}%`;
  
  elements.badgeAll.textContent = statistics.total_comments;
  elements.badgeHarassment.textContent = statistics.harassment_detected;
  elements.badgeSafe.textContent = statistics.total_comments - statistics.harassment_detected;
  
  createChart(statistics);
  displayComments(predictions);
}

// Animate number
function animateValue(el, start, end, duration) {
  if (!el) return;
  const range = end - start;
  const step = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += step;
    if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    el.textContent = Math.round(current);
  }, 16);
}

// Chart
function createChart(statistics) {
  const ctx = document.getElementById('sentimentChart');
  if (!ctx) return;
  
  // Vérifier si Chart est disponible
  if (typeof Chart === 'undefined') {
    console.error('Chart.js n\'est pas chargé');
    return;
  }
  
  // Détruire le graphique existant
  if (sentimentChart) {
    sentimentChart.destroy();
  }
  
  sentimentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Harcèlement', 'Sains'],
      datasets: [{
        data: [
          statistics.harassment_detected,
          statistics.total_comments - statistics.harassment_detected
        ],
        backgroundColor: [
          'rgba(245, 101, 101, 0.8)',
          'rgba(72, 187, 120, 0.8)'
        ],
        borderColor: [
          'rgba(245, 101, 101, 1)',
          'rgba(72, 187, 120, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 13,
              weight: '600'
            },
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-primary').trim(),
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Display comments list
function displayComments(predictions) {
  elements.commentsList.innerHTML = '';
  
  const filtered = predictions.filter(p => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'harassment') return p.is_harassment;
    if (currentFilter === 'safe') return !p.is_harassment;
  });
  
  if (!filtered.length) {
    elements.commentsList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px 20px;">Aucun commentaire dans cette catégorie</p>';
    return;
  }
  
  filtered.forEach((pred, i) => {
    elements.commentsList.appendChild(createCommentCard(pred, i));
  });
}

// Create single comment card
function createCommentCard(pred, index) {
  const div = document.createElement('div');
  div.className = `comment-card ${pred.is_harassment ? 'harassment' : 'safe'}`;
  div.style.animationDelay = `${index * 0.05}s`;
  
  const badgeText = pred.is_harassment ? '⚠️ Harcèlement' : '✓ Sain';
  const confidence = (pred.confidence * 100).toFixed(1);
  
  div.innerHTML = `
    <div class="comment-header">
      <span class="comment-badge">${badgeText}</span>
    </div>
    <div class="comment-text">${escapeHtml(pred.comment)}</div>
    <div class="comment-footer">
      <span>Confiance: ${confidence}%</span>
      <div class="confidence-bar">
        <div class="confidence-fill ${pred.is_harassment ? 'harassment' : 'safe'}" 
             style="width:${confidence}%"></div>
      </div>
    </div>
  `;
  
  return div;
}

// Filter
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  if (analysisData) {
    displayComments(analysisData.predictions);
  }
}

// Copy
function copyResults() {
  if (!analysisData) {
    showToast('Aucune donnée à copier', 'error');
    return;
  }
  
  const { predictions, statistics } = analysisData;
  let text = `=== ANALYSE DE CYBERHARCÈLEMENT ===\n\n`;
  text += `Total: ${statistics.total_comments}\n`;
  text += `Harcèlement: ${statistics.harassment_detected} (${statistics.harassment_percentage.toFixed(1)}%)\n`;
  text += `Sains: ${statistics.total_comments - statistics.harassment_detected}\n\n`;
  text += `=== DÉTAILS ===\n\n`;
  
  predictions.forEach((p, i) => {
    text += `${i + 1}. ${p.is_harassment ? '⚠️ HARCÈLEMENT' : '✓ SAIN'} (${(p.confidence * 100).toFixed(1)}%)\n`;
    text += `"${p.comment}"\n\n`;
  });
  
  navigator.clipboard.writeText(text)
    .then(() => showToast('Résultats copiés !'))
    .catch(() => showToast('Erreur copie', 'error'));
}

// Toast
function showToast(msg, type = 'success') {
  if (!elements.toast) return;
  elements.toastMessage.textContent = msg;
  elements.toast.classList.remove('hidden');
  setTimeout(() => elements.toast.classList.add('hidden'), 3000);
}

// Error
function showError(msg) {
  if (elements.errorMessage) {
    elements.errorMessage.textContent = msg;
  }
  showState('error');
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}