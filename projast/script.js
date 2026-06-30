// ===== AirGuard AI — Main Application Script =====

// =============================================
// 1. Loading Screen
// =============================================
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hidden');
    initCounters();
    initParticles();
  }, 1800);
});

// =============================================
// 2. Theme Toggle (Dark/Light)
// =============================================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check saved preference
const savedTheme = localStorage.getItem('airguard-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('airguard-theme', next);
  updateThemeIcon(next);
  // Re-render charts with new theme colors
  if (chartsInitialized) {
    destroyCharts();
    initCharts();
  }
});

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// =============================================
// 3. Navigation
// =============================================
const sections = document.querySelectorAll('.page-section');
const navLinks = document.querySelectorAll('.nav-links a');
let chartsInitialized = false;
let stationChartInitialized = false;

function navigateTo(page) {
  // Hide all sections
  sections.forEach(s => s.classList.remove('active'));
  // Show target
  const target = document.getElementById(page);
  if (target) {
    target.classList.add('active');
    target.style.animation = 'none';
    target.offsetHeight; // reflow
    target.style.animation = 'fadeIn 0.5s ease';
  }
  // Update nav links
  navLinks.forEach(a => a.classList.remove('active'));
  navLinks.forEach(a => {
    if (a.getAttribute('href') === '#' + page) a.classList.add('active');
  });
  // Close mobile menu
  document.getElementById('navLinks').classList.remove('show');
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Init charts when dashboard is first visited
  if (page === 'dashboard' && !chartsInitialized) {
    setTimeout(() => { initCharts(); chartsInitialized = true; }, 300);
  }
  if (page === 'dataset' && !stationChartInitialized) {
    setTimeout(() => { initStationCompareChart(); stationChartInitialized = true; }, 300);
  }
  // Re-init scroll animations
  setTimeout(initScrollAnimations, 100);
  // Re-init counters
  setTimeout(initCounters, 200);
}

// Mobile menu toggle
document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('show');
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  // Back to top button
  const btt = document.getElementById('backToTop');
  btt.classList.toggle('visible', window.scrollY > 400);
});

// =============================================
// 4. Date/Time Display
// =============================================
function updateDateTime() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
  const dateEl = document.getElementById('currentDate');
  const timeEl = document.getElementById('currentTime');
  if (dateEl) dateEl.textContent = dateStr;
  if (timeEl) timeEl.textContent = timeStr;
}
updateDateTime();
setInterval(updateDateTime, 1000);

// =============================================
// 5. Counter Animations
// =============================================
function initCounters() {
  const counters = document.querySelectorAll('.counter-value');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'));
        if (isNaN(target)) return;
        animateCounter(el, 0, target, 1500);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(c => observer.observe(c));
}

function animateCounter(el, start, end, duration) {
  const startTime = performance.now();
  const range = end - start;
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + range * easeProgress);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// =============================================
// 6. Scroll Animations
// =============================================
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(el => observer.observe(el));
}
initScrollAnimations();

// =============================================
// 7. Hero Particles
// =============================================
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = (2 + Math.random() * 4) + 'px';
    p.style.height = p.style.width;
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    p.style.opacity = 0.2 + Math.random() * 0.4;
    container.appendChild(p);
  }
}

// =============================================
// 8. Chart.js — Dashboard Charts
// =============================================
// Real monthly averages from the dataset (Station 02T — Bangkok area)
const monthlyData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  values: [51.1, 39.1, 32.5, 20.5, 15.5, 13.6, 15.8, 12.4, 11.8, 15.1, 20.4, 25.7]
};

// Simulated daily trend from actual data patterns
const dailyTrendData = generateDailyTrend();

function generateDailyTrend() {
  const data = [];
  const months = monthlyData.values;
  for (let m = 0; m < 12; m++) {
    const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31][m];
    for (let d = 0; d < daysInMonth; d++) {
      const base = months[m];
      const noise = (Math.random() - 0.5) * base * 0.4;
      data.push(Math.max(5, +(base + noise).toFixed(1)));
    }
  }
  return data;
}

function generateDailyLabels() {
  const labels = [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < daysInMonth[m]; d++) {
      labels.push(`${months[m]} ${d+1}`);
    }
  }
  return labels;
}

let trendChart, barChart, pieChart, stationChart;

function getChartColors() {
  const isDark = html.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#a0aec0' : '#4a5568',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tooltipBg: isDark ? '#1a2744' : '#ffffff',
    tooltipText: isDark ? '#e8edf5' : '#1a2332',
    tooltipBorder: isDark ? 'rgba(0,188,212,0.3)' : 'rgba(0,0,0,0.1)',
  };
}

function destroyCharts() {
  if (trendChart) { trendChart.destroy(); trendChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
  if (pieChart) { pieChart.destroy(); pieChart = null; }
  if (stationChart) { stationChart.destroy(); stationChart = null; }
  stationChartInitialized = false;
}

function initCharts() {
  const colors = getChartColors();

  // ---- PM2.5 Trend Line Chart ----
  const trendCtx = document.getElementById('trendChart');
  if (!trendCtx) return;
  
  const dailyLabels = generateDailyLabels();
  const gradient1 = trendCtx.getContext('2d').createLinearGradient(0, 0, 0, 300);
  gradient1.addColorStop(0, 'rgba(0, 188, 212, 0.3)');
  gradient1.addColorStop(1, 'rgba(0, 188, 212, 0.0)');

  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: dailyLabels,
      datasets: [{
        label: 'PM2.5 (µg/m³)',
        data: dailyTrendData,
        borderColor: '#00bcd4',
        backgroundColor: gradient1,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#00bcd4',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }, {
        label: 'WHO Guideline (15 µg/m³)',
        data: Array(dailyTrendData.length).fill(15),
        borderColor: 'rgba(239, 83, 80, 0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      }, {
        label: 'Thailand Standard (37.5 µg/m³)',
        data: Array(dailyTrendData.length).fill(37.5),
        borderColor: 'rgba(255, 152, 0, 0.5)',
        borderWidth: 1.5,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" }, usePointStyle: true, pointStyle: 'circle', padding: 20 }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          titleFont: { weight: '700', family: "'Inter', sans-serif" },
          bodyFont: { family: "'Inter', sans-serif" },
        }
      },
      scales: {
        x: {
          grid: { color: colors.grid, drawBorder: false },
          ticks: { color: colors.text, maxTicksLimit: 12, font: { size: 11, family: "'Inter', sans-serif" } },
        },
        y: {
          grid: { color: colors.grid, drawBorder: false },
          ticks: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" }, callback: v => v + ' µg/m³' },
          beginAtZero: true,
        }
      }
    }
  });

  // ---- Monthly Average Bar Chart ----
  const barCtx = document.getElementById('barChart');
  if (!barCtx) return;

  const barColors = monthlyData.values.map(v => {
    if (v <= 15) return '#66bb6a';
    if (v <= 25) return '#ffeb3b';
    if (v <= 37.5) return '#ff9800';
    if (v <= 75) return '#ef5350';
    return '#9c27b0';
  });

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: monthlyData.labels,
      datasets: [{
        label: 'Avg PM2.5 (µg/m³)',
        data: monthlyData.values,
        backgroundColor: barColors.map(c => c + 'cc'),
        borderColor: barColors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          titleFont: { weight: '700', family: "'Inter', sans-serif" },
          bodyFont: { family: "'Inter', sans-serif" },
          callbacks: {
            label: ctx => `PM2.5: ${ctx.parsed.y.toFixed(1)} µg/m³`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.text, font: { size: 11, weight: '600', family: "'Inter', sans-serif" } }
        },
        y: {
          grid: { color: colors.grid, drawBorder: false },
          ticks: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" } },
          beginAtZero: true,
        }
      }
    }
  });

  // ---- AQI Distribution Pie Chart ----
  const pieCtx = document.getElementById('pieChart');
  if (!pieCtx) return;

  // Distribution based on actual data patterns
  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Good (0–25)', 'Moderate (26–37.5)', 'Unhealthy for SG (37.6–75)', 'Unhealthy (>75)'],
      datasets: [{
        data: [145, 95, 105, 20],
        backgroundColor: [
          'rgba(102, 187, 106, 0.85)',
          'rgba(255, 235, 59, 0.85)',
          'rgba(255, 152, 0, 0.85)',
          'rgba(239, 83, 80, 0.85)',
        ],
        borderColor: [
          '#66bb6a',
          '#ffeb3b',
          '#ff9800',
          '#ef5350',
        ],
        borderWidth: 2,
        hoverOffset: 12,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { 
            color: colors.text, 
            font: { size: 11, family: "'Inter', sans-serif" }, 
            usePointStyle: true, 
            pointStyle: 'circle', 
            padding: 16 
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          titleFont: { weight: '700', family: "'Inter', sans-serif" },
          bodyFont: { family: "'Inter', sans-serif" },
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} days (${((ctx.parsed/365)*100).toFixed(1)}%)`
          }
        }
      }
    }
  });
}

// Station Comparison Chart (Dataset page)
function initStationCompareChart() {
  const ctx = document.getElementById('stationCompareChart');
  if (!ctx) return;
  const colors = getChartColors();

  // Monthly averages for 5 representative stations (from actual data patterns)
  const stations = {
    '02T (Bangkok)': [51.1, 39.1, 32.5, 20.5, 15.5, 13.6, 15.8, 12.4, 11.8, 15.1, 20.4, 25.7],
    '05T (Chiang Mai)': [58.3, 45.2, 38.7, 18.2, 12.8, 10.5, 13.2, 10.1, 9.8, 13.5, 22.8, 30.1],
    '10T (Lampang)': [55.7, 42.8, 36.1, 19.4, 13.5, 11.2, 14.1, 10.8, 10.2, 14.2, 21.5, 28.4],
    '22T (Khon Kaen)': [42.3, 35.6, 28.9, 17.8, 14.2, 12.8, 13.9, 11.5, 11.0, 14.8, 19.2, 24.5],
    '59T (Southern)': [26.8, 22.4, 20.1, 15.2, 12.1, 10.8, 11.5, 10.2, 9.5, 11.8, 16.5, 20.3],
  };

  const chartColors = ['#00bcd4', '#66bb6a', '#ff9800', '#7c4dff', '#ef5350'];

  stationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.labels,
      datasets: Object.entries(stations).map(([name, data], i) => ({
        label: name,
        data: data,
        borderColor: chartColors[i],
        backgroundColor: chartColors[i] + '15',
        borderWidth: 2.5,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: chartColors[i],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" }, usePointStyle: true, padding: 16 }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          titleFont: { weight: '700', family: "'Inter', sans-serif" },
          bodyFont: { family: "'Inter', sans-serif" },
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} µg/m³`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.text, font: { size: 11, weight: '600', family: "'Inter', sans-serif" } }
        },
        y: {
          grid: { color: colors.grid, drawBorder: false },
          ticks: { color: colors.text, font: { size: 11, family: "'Inter', sans-serif" }, callback: v => v + ' µg/m³' },
          beginAtZero: true,
        }
      }
    }
  });
  stationChartInitialized = true;
}

// =============================================
// 9. Prediction Engine (Simulated ML)
// =============================================
const provinceProfiles = {
  bangkok:           { base: 22.8, name: 'Bangkok', station: '02T' },
  chiangmai:         { base: 24.0, name: 'Chiang Mai', station: '05T' },
  chiangrai:         { base: 25.5, name: 'Chiang Rai', station: '03T' },
  khonkaen:          { base: 20.2, name: 'Khon Kaen', station: '22T' },
  nongkhai:          { base: 18.5, name: 'Nong Khai', station: '20T' },
  nakhonratchasima:  { base: 21.0, name: 'Nakhon Ratchasima', station: '13T' },
  udonthani:         { base: 19.8, name: 'Udon Thani', station: '14T' },
  songkhla:          { base: 16.2, name: 'Songkhla', station: '35T' },
  phuket:            { base: 14.5, name: 'Phuket', station: '40T' },
  rayong:            { base: 20.5, name: 'Rayong', station: '28T' },
  lampang:           { base: 26.8, name: 'Lampang', station: '10T' },
  saraburi:          { base: 22.0, name: 'Saraburi', station: '12T' },
  nonthaburi:        { base: 21.5, name: 'Nonthaburi', station: '11T' },
  pathumthani:       { base: 20.8, name: 'Pathum Thani', station: '52T' },
  samutprakan:       { base: 21.2, name: 'Samut Prakan', station: '53T' },
};

// Seasonal multiplier based on real data patterns
function getSeasonalMultiplier(month) {
  const multipliers = {
    0: 2.24, // Jan
    1: 1.72, // Feb
    2: 1.43, // Mar
    3: 0.90, // Apr
    4: 0.68, // May
    5: 0.60, // Jun
    6: 0.69, // Jul
    7: 0.54, // Aug
    8: 0.52, // Sep
    9: 0.66, // Oct
    10: 0.90, // Nov
    11: 1.13, // Dec
  };
  return multipliers[month] || 1;
}

function predictPM25(province, date) {
  const profile = provinceProfiles[province];
  if (!profile) return null;

  const d = new Date(date);
  const month = d.getMonth();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  
  // Compute predicted PM2.5 based on seasonal patterns + noise
  const seasonal = getSeasonalMultiplier(month);
  const noise = (Math.sin(dayOfYear * 0.1) * 3) + (Math.random() - 0.5) * 5;
  const predicted = Math.max(5, +(profile.base * seasonal + noise).toFixed(1));
  
  return {
    pm25: predicted,
    province: profile.name,
    station: profile.station,
    date: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    ...classifyAQI(predicted),
  };
}

function classifyAQI(pm25) {
  if (pm25 <= 15) return { 
    aqi: Math.round(pm25 / 15 * 50),
    aqiLabel: 'Good', 
    aqiClass: 'good', 
    healthRisk: 'Low',
    riskColor: '#66bb6a',
    gaugePos: (pm25 / 15 * 20) + '%',
    recommendations: [
      { icon: 'fa-check-circle', text: 'Air quality is satisfactory — safe for all outdoor activities' },
      { icon: 'fa-running', text: 'Great conditions for jogging, cycling, and exercise' },
      { icon: 'fa-window-maximize', text: 'Open windows for fresh air ventilation' },
    ]
  };
  if (pm25 <= 25) return { 
    aqi: 50 + Math.round((pm25 - 15) / 10 * 25),
    aqiLabel: 'Moderate', 
    aqiClass: 'moderate', 
    healthRisk: 'Moderate',
    riskColor: '#ffeb3b',
    gaugePos: (20 + (pm25 - 15) / 10 * 15) + '%',
    recommendations: [
      { icon: 'fa-user-shield', text: 'Generally acceptable — unusually sensitive people should limit prolonged outdoor exertion' },
      { icon: 'fa-lungs', text: 'People with asthma should keep inhalers nearby' },
      { icon: 'fa-eye', text: 'Monitor air quality updates throughout the day' },
    ]
  };
  if (pm25 <= 37.5) return { 
    aqi: 76 + Math.round((pm25 - 25) / 12.5 * 74),
    aqiLabel: 'Unhealthy for Sensitive Groups', 
    aqiClass: 'sensitive', 
    healthRisk: 'High',
    riskColor: '#ff9800',
    gaugePos: (35 + (pm25 - 25) / 12.5 * 20) + '%',
    recommendations: [
      { icon: 'fa-mask', text: 'Wear N95 mask when going outdoors' },
      { icon: 'fa-person-walking', text: 'Reduce prolonged outdoor exertion' },
      { icon: 'fa-house-chimney-window', text: 'Keep windows closed and use air purifier if available' },
      { icon: 'fa-child', text: 'Children, elderly, and people with respiratory conditions should stay indoors' },
    ]
  };
  if (pm25 <= 75) return { 
    aqi: 151 + Math.round((pm25 - 37.5) / 37.5 * 49),
    aqiLabel: 'Unhealthy', 
    aqiClass: 'unhealthy', 
    healthRisk: 'Very High',
    riskColor: '#ef5350',
    gaugePos: (55 + (pm25 - 37.5) / 37.5 * 20) + '%',
    recommendations: [
      { icon: 'fa-head-side-mask', text: 'Wear N95 mask at all times outdoors — mandatory' },
      { icon: 'fa-ban', text: 'Avoid all outdoor exercise and prolonged exposure' },
      { icon: 'fa-fan', text: 'Use air purifiers with HEPA filters indoors' },
      { icon: 'fa-phone-alt', text: 'Seek medical attention if experiencing breathing difficulties' },
      { icon: 'fa-chart-line', text: 'Monitor air quality hourly — conditions may worsen' },
    ]
  };
  return { 
    aqi: 200 + Math.round((pm25 - 75) / 25 * 100),
    aqiLabel: 'Hazardous', 
    aqiClass: 'unhealthy', 
    healthRisk: 'Hazardous',
    riskColor: '#9c27b0',
    gaugePos: '90%',
    recommendations: [
      { icon: 'fa-exclamation-triangle', text: 'EMERGENCY — Stay indoors at all times' },
      { icon: 'fa-head-side-mask', text: 'N95 or P100 mask required if outdoor exposure is unavoidable' },
      { icon: 'fa-hospital', text: 'Prepare for possible evacuation — follow government advisories' },
      { icon: 'fa-fan', text: 'Seal windows and doors — run air purifiers on maximum' },
      { icon: 'fa-phone-alt', text: 'Call emergency services if experiencing severe symptoms' },
    ]
  };
}

function runPrediction() {
  const province = document.getElementById('provinceSelect').value;
  const date = document.getElementById('dateInput').value;
  const resultsDiv = document.getElementById('predictionResults');
  const placeholder = document.getElementById('predictionPlaceholder');
  
  if (!province) {
    alert('Please select a province');
    return;
  }
  if (!date) {
    alert('Please select a date');
    return;
  }

  const result = predictPM25(province, date);
  if (!result) return;

  // Build result HTML
  const html = `
    <div class="prediction-result-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="font-size: 0.78rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Prediction Result</div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">
            <i class="fas fa-map-marker-alt" style="color: var(--primary-500);"></i> ${result.province} (${result.station})
          </div>
          <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 2px;">
            <i class="fas fa-calendar" style="margin-right: 4px;"></i> ${result.date}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="live-dot" style="background: ${result.riskColor};"></span>
          <span style="font-size: 0.82rem; font-weight: 700; color: ${result.riskColor};">Risk: ${result.healthRisk}</span>
        </div>
      </div>

      <div class="result-main">
        <div class="result-item">
          <div class="result-label">Predicted PM2.5</div>
          <div class="result-value pm25-color">${result.pm25}</div>
          <div class="result-suffix">µg/m³</div>
        </div>
        <div class="result-item">
          <div class="result-label">AQI Level</div>
          <div class="result-value aqi-${result.aqiClass}">${result.aqi}</div>
          <div><span class="aqi-badge ${result.aqiClass}"><i class="fas fa-circle" style="font-size: 0.5rem;"></i> ${result.aqiLabel}</span></div>
        </div>
        <div class="result-item">
          <div class="result-label">Health Risk</div>
          <div class="result-value" style="color: ${result.riskColor}; font-size: 1.6rem;">${result.healthRisk}</div>
          <div class="result-suffix">Sensitivity Level</div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <div style="font-size: 0.82rem; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 600;">AQI Scale</div>
        <div class="aqi-gauge">
          <div class="aqi-gauge-marker" style="left: ${result.gaugePos};"></div>
        </div>
        <div class="aqi-labels">
          <span>Good</span>
          <span>Moderate</span>
          <span>Unhealthy SG</span>
          <span>Unhealthy</span>
          <span>Hazardous</span>
        </div>
      </div>

      <div class="recommendations">
        <h4><i class="fas fa-shield-heart"></i> Health Recommendations</h4>
        <ul class="rec-list">
          ${result.recommendations.map(r => `
            <li><i class="fas ${r.icon}"></i> ${r.text}</li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

  if (placeholder) placeholder.style.display = 'none';
  
  // Animate the result in
  resultsDiv.innerHTML = html;
  const card = resultsDiv.querySelector('.prediction-result-card');
  if (card) {
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'fadeInUp 0.5s ease';
  }
}

// =============================================
// 10. Keyboard navigation
// =============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('navLinks').classList.remove('show');
  }
});

// Close mobile menu on outside click
document.addEventListener('click', (e) => {
  const nav = document.getElementById('navLinks');
  const toggle = document.getElementById('mobileToggle');
  if (!nav.contains(e.target) && !toggle.contains(e.target)) {
    nav.classList.remove('show');
  }
});
