const isFirebaseConfigured = () => {
  const config = window.firebaseConfig || {};
  return Boolean(
    config.apiKey &&
    config.apiKey !== 'YOUR_API_KEY' &&
    config.projectId &&
    config.projectId !== 'YOUR_PROJECT_ID' &&
    config.appId &&
    config.appId !== 'YOUR_APP_ID'
  );
};

const setAuthMessage = (message, type = 'error') => {
  const authMessage = document.getElementById('auth-message');
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`;
};

const storageKey = 'cyberguard_users';

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem(storageKey, JSON.stringify(users));
};

const handleLocalLogin = (email, password) => {
  const users = readUsers();
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);

  if (!user) {
    return { ok: false, message: 'Invalid email or password.' };
  }

  localStorage.setItem('cyberguard_current_user', JSON.stringify({
    email: user.email,
    name: user.name
  }));

  return { ok: true, message: 'Login successful.' };
};

const handleLocalRegister = (name, email, password) => {
  const users = readUsers();
  const emailExists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

  if (emailExists) {
    return { ok: false, message: 'This email is already registered.' };
  }

  users.push({ name, email: email.toLowerCase(), password });
  saveUsers(users);

  localStorage.setItem('cyberguard_current_user', JSON.stringify({ email: email.toLowerCase(), name }));
  return { ok: true, message: 'Account created successfully.' };
};

const redirectToDashboard = () => {
  window.location.href = 'dashboard.html';
};

const hasFirebaseAuth = () => {
  return typeof window.firebase !== 'undefined' && typeof window.firebase.auth === 'function' && isFirebaseConfigured();
};

if (!isFirebaseConfigured()) {
  setAuthMessage('Firebase is not configured yet. Demo mode is active, so you can still register and login locally.', 'success');
}

const isDashboardPage = document.getElementById('module-name');

if (isDashboardPage) {
  const moduleData = {
    scanner: {
      name: 'Web Scanner',
      status: 'Operational',
      score: '92%',
      uptime: '99.9%',
      findings: '3',
      analysis: [
        'Critical vulnerabilities are not currently exposed.',
        'Authentication flows are protected with layered validation.',
        'Adaptive monitoring is tracking suspicious traffic patterns.'
      ]
    },
    threat: {
      name: 'Threat Center',
      status: 'Monitoring',
      score: '88%',
      uptime: '99.7%',
      findings: '7',
      analysis: [
        'Threat feed is synchronized across global intelligence sources.',
        'Botnet activity is below the high-risk threshold.',
        'Incident response playbooks are ready for active alerts.'
      ]
    },
    lab: {
      name: 'Cyber Lab',
      status: 'Testing',
      score: '94%',
      uptime: '98.8%',
      findings: '2',
      analysis: [
        'Simulation exercises show strong recovery response times.',
        'Red-team tactics are evaluated against hardened controls.',
        'Security education modules are progressing with strong completion rates.'
      ]
    },
    crypto: {
      name: 'Cryptography',
      status: 'Secured',
      score: '96%',
      uptime: '100%',
      findings: '1',
      analysis: [
        'Key rotation policy is active and aligned with best practices.',
        'Cipher configuration is compliant with enterprise standards.',
        'Encryption checks confirm data protection for critical services.'
      ]
    }
  };

  const moduleButtons = document.querySelectorAll('.module-button');
  const moduleName = document.getElementById('module-name');
  const moduleStatus = document.getElementById('module-status');
  const moduleScore = document.getElementById('module-score');
  const moduleUptime = document.getElementById('module-uptime');
  const moduleFindings = document.getElementById('module-findings');
  const moduleAnalysis = document.getElementById('module-analysis');

  function updateModule(moduleKey) {
    const selected = moduleData[moduleKey];
    if (!selected) return;

    moduleName.textContent = selected.name;
    moduleStatus.textContent = selected.status;
    moduleScore.textContent = selected.score;
    moduleUptime.textContent = selected.uptime;
    moduleFindings.textContent = selected.findings;
    moduleAnalysis.innerHTML = selected.analysis.map((item) => `<li>${item}</li>`).join('');

    moduleButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.module === moduleKey);
    });
  }

  moduleButtons.forEach((button) => {
    button.addEventListener('click', () => updateModule(button.dataset.module));
  });

  const scores = Object.values(moduleData).map((module) => Number.parseInt(module.score, 10));
  const overallScore = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const overallScoreElement = document.getElementById('overall-score');
  if (overallScoreElement) {
    overallScoreElement.textContent = overallScore;
  }

  const riskStatus = document.getElementById('risk-status');
  if (riskStatus) {
    riskStatus.textContent = overallScore >= 90 ? 'Strong Defense' : overallScore >= 80 ? 'Solid Protection' : 'Needs Attention';
  }

  updateModule('scanner');
}

const toggleButtons = document.querySelectorAll('.toggle-btn');
const formPanels = document.querySelectorAll('.form-panel');

if (toggleButtons.length) {
  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.form;

      toggleButtons.forEach((item) => item.classList.toggle('active', item === button));
      formPanels.forEach((form) => {
        form.classList.toggle('active', form.id === `${target}-form`);
      });
    });
  });
}

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const setupPanel = document.getElementById('setup-panel');
const setupName = document.getElementById('setup-name');
const continueSetupButton = document.getElementById('continue-setup');
const authMessage = document.getElementById('auth-message');

const showSetupPanel = (name = 'User') => {
  if (!setupPanel) return;

  if (setupName) {
    setupName.textContent = name || 'User';
  }

  formPanels.forEach((form) => form.classList.add('hidden'));
  toggleButtons.forEach((button) => button.classList.add('hidden'));
  if (authMessage) {
    authMessage.classList.add('hidden');
  }
  setupPanel.classList.remove('hidden');
};

const hideSetupPanel = () => {
  if (!setupPanel) return;
  setupPanel.classList.add('hidden');
};

const saveUserInterest = (interest) => {
  const currentUser = JSON.parse(localStorage.getItem('cyberguard_current_user') || '{}');
  localStorage.setItem('cyberguard_user_interest', JSON.stringify({
    email: currentUser.email || '',
    name: currentUser.name || '',
    interest
  }));
};

if (continueSetupButton) {
  continueSetupButton.addEventListener('click', () => {
    const selected = document.querySelector('input[name="interest"]:checked');
    const interest = selected ? selected.value : 'Web Security';
    saveUserInterest(interest);
    redirectToDashboard();
  });
}

if (loginForm && registerForm) {
  const authFormHandler = async (event, mode) => {
    event.preventDefault();

    if (mode === 'login') {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();

      if (!email || !password) {
        setAuthMessage('Please enter both email and password.', 'error');
        return;
      }

      if (hasFirebaseAuth()) {
        const auth = window.firebase.auth();
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'LOGIN...';

        try {
          await auth.signInWithEmailAndPassword(email, password);
          setAuthMessage('Login successful. Redirecting...', 'success');
          setTimeout(redirectToDashboard, 800);
        } catch (error) {
          setAuthMessage(error.message || 'Login failed. Please try again.', 'error');
          submitButton.disabled = false;
          submitButton.textContent = 'LOGIN';
        }
        return;
      }

      const result = handleLocalLogin(email, password);
      if (!result.ok) {
        setAuthMessage(result.message, 'error');
        return;
      }

      setAuthMessage('Login successful. Redirecting...', 'success');
      setTimeout(redirectToDashboard, 800);
      return;
    }

    const fullName = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    if (!fullName || !email || !password || !confirmPassword) {
      setAuthMessage('Please fill in all the required fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      setAuthMessage('Passwords do not match.', 'error');
      return;
    }

    if (hasFirebaseAuth()) {
      const auth = window.firebase.auth();
      const submitButton = registerForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'CREATING...';

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        if (userCredential.user) {
          await userCredential.user.updateProfile({ displayName: fullName });
        }
        setAuthMessage('Account created successfully. Redirecting...', 'success');
        showSetupPanel(fullName);
      } catch (error) {
        setAuthMessage(error.message || 'Registration failed. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'CREATE ACCOUNT';
      }
      return;
    }

    const result = handleLocalRegister(fullName, email, password);
    if (!result.ok) {
      setAuthMessage(result.message, 'error');
      return;
    }

    setAuthMessage('Account created successfully. Redirecting...', 'success');
    showSetupPanel(fullName);
  };

  loginForm.addEventListener('submit', (event) => authFormHandler(event, 'login'));
  registerForm.addEventListener('submit', (event) => authFormHandler(event, 'register'));

  const forgotPasswordLink = document.getElementById('forgot-password');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email').value.trim();

      if (!email) {
        setAuthMessage('Enter your email address first to reset your password.', 'error');
        return;
      }

      if (hasFirebaseAuth()) {
        try {
          const auth = window.firebase.auth();
          await auth.sendPasswordResetEmail(email);
          setAuthMessage('Password reset email sent successfully.', 'success');
        } catch (error) {
          setAuthMessage(error.message || 'Unable to send password reset email.', 'error');
        }
        return;
      }

      const users = readUsers();
      const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

      if (!exists) {
        setAuthMessage('No account found with this email.', 'error');
        return;
      }

      setAuthMessage('Password reset is not available in demo mode. Use the registered password from your account.', 'success');
    });
  }
}

const textLinks = document.querySelectorAll('.text-link');
textLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const formTarget = link.dataset.form;
    toggleButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.form === formTarget);
    });
    formPanels.forEach((form) => {
      form.classList.toggle('active', form.id === `${formTarget}-form`);
    });
  });
});

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const currentUserName = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('cyberguard_current_user') || '{}');
    return currentUser.name || 'Omkar';
  } catch {
    return 'Omkar';
  }
};

const userNameLabel = document.getElementById('dashboard-user-name');
if (userNameLabel) {
  userNameLabel.textContent = currentUserName();
}

document.querySelectorAll('.action-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    if (target) {
      window.location.href = target;
    }
  });
});

const scannerInput = document.getElementById('site-url');
const scanButton = document.getElementById('scan-btn');
const targetUrl = document.getElementById('target-url');
const scanScore = document.getElementById('scan-score');
const scanResults = document.getElementById('scan-results');
const scanProgressBar = document.getElementById('scan-progress-bar');
const scanPhase = document.getElementById('scan-phase');
const scanPercent = document.getElementById('scan-percent');
const scanChecks = document.getElementById('scan-checks');
const reportPanel = document.getElementById('report-panel');
const reportUrl = document.getElementById('report-url');
const reportScore = document.getElementById('report-score');
const reportRisk = document.getElementById('report-risk');
const graphGrid = document.getElementById('graph-grid');
const vulnSummary = document.getElementById('vuln-summary');
const reportFindings = document.getElementById('report-findings');
const reportRecommendations = document.getElementById('report-recommendations');
const viewReportButton = document.getElementById('view-report-button');

const scanSteps = [
  'URL validation',
  'HTTPS / SSL',
  'Security headers',
  'HTTP configuration',
  'Cookie security',
  'Redirect configuration',
  'Technology detection',
  'Basic vulnerability indicators'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setProgressState = (progress, phaseText, listText) => {
  if (scanProgressBar) {
    scanProgressBar.style.width = `${progress}%`;
  }
  if (scanPercent) {
    scanPercent.textContent = `${Math.round(progress)}%`;
  }
  if (scanPhase) {
    scanPhase.textContent = phaseText;
  }
  if (scanChecks) {
    const items = scanChecks.querySelectorAll('li');
    items.forEach((item, index) => {
      const text = listText[index] || item.textContent;
      item.textContent = text;
      item.className = index < Math.floor(progress / 12.5) ? 'passed' : index === Math.floor(progress / 12.5) ? 'scanning' : 'pending';
    });
  }
};

const formatStatus = (status) => {
  if (status === 'Passed') return 'passed';
  if (status === 'Warning') return 'warning';
  if (status === 'Failed') return 'failed';
  return 'pending';
};

const renderScanSummary = (report) => {
  if (!report) return;

  if (scanScore) scanScore.textContent = `${report.score}%`;
  if (targetUrl) targetUrl.textContent = report.url;
  if (reportUrl) reportUrl.textContent = report.url;
  if (reportScore) reportScore.textContent = `${report.score} / 100`;
  if (reportRisk) reportRisk.textContent = report.riskLevel;

  if (reportPanel) {
    reportPanel.classList.remove('hidden');
  }

  if (graphGrid) {
    graphGrid.innerHTML = (report.graphData || []).map((item) => `
      <div class="graph-item">
        <h5>${item.label}</h5>
        <div class="graph-bar"><span style="width: ${Math.min(100, Number(item.value || 0))}%"></span></div>
      </div>
    `).join('');
  }

  if (vulnSummary) {
    const summary = report.vulnerabilitySummary || { critical: 0, high: 0, medium: 0, low: 0, passed: 0 };
    vulnSummary.innerHTML = `
      <div class="vuln-chip"><strong>${summary.critical}</strong>Critical</div>
      <div class="vuln-chip"><strong>${summary.high}</strong>High</div>
      <div class="vuln-chip"><strong>${summary.medium}</strong>Medium</div>
      <div class="vuln-chip"><strong>${summary.low}</strong>Low</div>
      <div class="vuln-chip"><strong>${summary.passed}</strong>Passed</div>
    `;
  }

  if (scanResults) {
    const summaryItems = [
      `Target: ${report.url}`,
      `Security Score: ${report.score} / 100`,
      `Risk Level: ${report.riskLevel}`,
      `Scan Status: ${report.status}`,
      `Assessment: ${report.summary?.assessment || 'Review completed.'}`
    ];
    scanResults.innerHTML = summaryItems.map((item) => `<li>${item}</li>`).join('');
  }

  if (reportFindings) {
    const items = (report.findings || []).length
      ? report.findings.map((item) => `<li><strong>${item.severity}</strong> — ${item.title}: ${item.summary}</li>`)
      : ['<li>No major vulnerabilities detected in the initial assessment.</li>'];
    reportFindings.innerHTML = items.join('');
  }

  if (reportRecommendations) {
    reportRecommendations.innerHTML = (report.recommendations || []).map((item) => `<li>${item}</li>`).join('');
  }

  if (scanChecks) {
    const summaryRow = Array.from(scanChecks.querySelectorAll('li'));
    (report.checks || []).forEach((check, index) => {
      if (summaryRow[index]) {
        const status = formatStatus(check.status);
        summaryRow[index].className = status;
        summaryRow[index].textContent = `${check.name} — ${check.status}`;
      }
    });
  }

  if (viewReportButton) {
    viewReportButton.onclick = () => {
      localStorage.setItem('cyberguard_last_report', JSON.stringify(report));
      window.location.href = 'report.html';
    };
  }
};

const startScanAnimation = async () => {
  const progressValues = [10, 22, 34, 48, 62, 75, 88, 100];
  const messages = [
    'Validating URL format and access...',
    'Inspecting HTTPS and SSL readiness...',
    'Analyzing security headers...',
    'Checking HTTP configuration...',
    'Reviewing cookie security...',
    'Inspecting redirect policies...',
    'Detecting technology stack...',
    'Evaluating basic vulnerability indicators...'
  ];

  for (let index = 0; index < progressValues.length; index += 1) {
    const progress = progressValues[index];
    const message = messages[index];
    const currentChecks = scanSteps.map((step, stepIndex) => {
      if (stepIndex < index) return `${step} — Passed`;
      if (stepIndex === index) return `${step} — Scanning`;
      return `${step} — Pending`;
    });

    setProgressState(progress, message, currentChecks);
    await sleep(480);
  }
};

const validateUrl = (value) => {
  if (!value) {
    throw new Error('Please enter a valid website URL.');
  }

  const trimmed = value.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP or HTTPS URLs are supported.');
    }
    return parsed.href;
  } catch {
    throw new Error('Please enter a valid website URL, for example: https://example.com');
  }
};

if (scannerInput && scanButton && scanResults && scanProgressBar) {
  scanButton.addEventListener('click', async () => {
    let es;
    try {
      const validUrl = validateUrl(scannerInput.value);
      scanButton.disabled = true;
      scanButton.textContent = 'Scanning...';
      scanResults.innerHTML = '<li>Initializing scan...</li>';

      // create job
      const startResp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validUrl })
      });

      const startData = await startResp.json();
      if (!startResp.ok || !startData.success) throw new Error(startData.error || 'Unable to start scan');

      const jobId = startData.id;
      // open SSE stream for real-time events
      es = new EventSource(`/api/scan/${jobId}/events`);

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'progress') {
            setProgressState(data.progress || 0, data.message || 'Scanning...', []);
          } else if (data.type === 'step') {
            // update progress and checks
            const listText = scanSteps.map((s) => `${s} — Pending`);
            // mark passed for previous steps
            const currentIndex = scanSteps.findIndex((s) => s === data.step);
            for (let i = 0; i < scanSteps.length; i++) {
              if (i < currentIndex) listText[i] = `${scanSteps[i]} — Passed`;
              else if (i === currentIndex) listText[i] = `${scanSteps[i]} — Scanning`;
              else listText[i] = `${scanSteps[i]} — Pending`;
            }
            setProgressState(data.progress || 0, `${data.step} — ${data.status}`, listText);
          } else if (data.type === 'completed') {
            // final report available
            const report = data.report;
            setProgressState(100, 'Scan completed — generating report', report.checks ? report.checks.map((c) => `${c.name} — ${c.status}`) : scanSteps);
            renderScanSummary(report);
            localStorage.setItem('cyberguard_last_report', JSON.stringify(report));
            if (es) es.close();
            scanButton.disabled = false;
            scanButton.textContent = 'Scan Now';
          } else if (data.type === 'failed') {
            if (scanPhase) scanPhase.textContent = 'Scan failed';
            if (scanResults) scanResults.innerHTML = `<li>${data.message}</li>`;
            if (es) es.close();
            scanButton.disabled = false;
            scanButton.textContent = 'Scan Now';
          }
        } catch (err) {
          // ignore parse errors
        }
      };

      es.onerror = (err) => {
        if (scanPhase) scanPhase.textContent = 'Scan connection error';
      };
    } catch (error) {
      if (scanPhase) scanPhase.textContent = 'Scan failed';
      if (scanResults) scanResults.innerHTML = `<li>${error.message}</li>`;
      if (scanProgressBar) scanProgressBar.style.width = '0%';
      if (scanPercent) scanPercent.textContent = '0%';
      if (es) es.close();
      scanButton.disabled = false;
      scanButton.textContent = 'Scan Now';
    }
  });

  scannerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      scanButton.click();
    }
  });

  scannerInput.addEventListener('input', () => {
    if (scanResults) {
      scanResults.innerHTML = '<li>Waiting for a website scan to begin.</li>';
    }
  });
}
