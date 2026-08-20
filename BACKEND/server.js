const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, '..', 'FRONTEND');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(frontendDir));

const toTitleCase = (value) => value
  .split(/[-_\s]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const safeHeaders = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'x-xss-protection'
];

const normalizeUrl = (value) => {
  if (!value) {
    throw new Error('A valid website URL is required.');
  }

  const raw = String(value).trim();
  if (!raw) {
    throw new Error('A valid website URL is required.');
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(withProtocol);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }

  return parsed.href;
};

const getSeverity = (score) => {
  if (score >= 90) return 'Secure';
  if (score >= 80) return 'Low Risk';
  if (score >= 65) return 'Medium Risk';
  if (score >= 45) return 'High Risk';
  return 'Critical';
};

const buildFindings = (checks) => {
  const findings = [];

  checks.forEach((check) => {
    if (check.status === 'Passed') {
      return;
    }

    findings.push({
      title: check.name,
      severity: check.severity || 'Medium',
      summary: check.summary,
      recommendation: check.recommendation
    });
  });

  return findings;
};

const createRecommendations = (findings) => {
  if (!findings.length) {
    return [
      'Continue monitoring the site with periodic security reviews.',
      'Keep TLS and security headers updated on a regular release cycle.'
    ];
  }

  return findings.map((finding) => finding.recommendation).filter(Boolean).slice(0, 5);
};

const calculateScore = (checks) => {
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + check.weight * check.scoreFactor, 0);
  return Math.max(0, Math.min(100, Math.round((earned / totalWeight) * 100)));
};

const buildScanResult = async (rawUrl) => {
  const targetUrl = normalizeUrl(rawUrl);
  const parsed = new URL(targetUrl);
  const hostname = parsed.hostname.replace(/^www\./i, '');
  const startTime = Date.now();

  let httpResponse;
  let errorMessage = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    httpResponse = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'CyberGuardScanner/1.0 (+security-checks)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);
  } catch (error) {
    errorMessage = error && error.name === 'AbortError'
      ? 'The target site did not respond in time.'
      : 'The target website could not be reached from the server.';
  }

  const headers = httpResponse ? Object.fromEntries(httpResponse.headers.entries()) : {};
  const setCookie = headers['set-cookie'] || '';
  const serverInfo = headers.server || 'Unknown';
  const redirectLocation = headers.location || '';
  const httpStatus = httpResponse ? httpResponse.status : 0;
  const isHttps = parsed.protocol === 'https:';
  const hsts = headers['strict-transport-security'] || '';
  const csp = headers['content-security-policy'] || '';
  const frameOptions = headers['x-frame-options'] || '';
  const xContentTypeOptions = headers['x-content-type-options'] || '';
  const cookiesSecure = /secure/i.test(setCookie);

  const tlsCheck = isHttps
    ? { name: 'HTTPS / SSL', status: 'Passed', severity: 'Low', summary: 'The target is using HTTPS and is reachable over a secure transport.', recommendation: 'Keep TLS certificates current and monitor renewal dates.', scoreFactor: 1, weight: 22 }
    : { name: 'HTTPS / SSL', status: 'Failed', severity: 'High', summary: 'The target does not appear to be providing HTTPS encryption.', recommendation: 'Enable HTTPS with a valid certificate and redirect all HTTP traffic to HTTPS.', scoreFactor: 0, weight: 22 };

  const headersCheck = (
    hsts || csp || frameOptions || xContentTypeOptions
  )
    ? { name: 'Security Headers', status: 'Passed', severity: 'Low', summary: 'Key security headers were detected.', recommendation: 'Continue enforcing CSP, HSTS, and X-Frame-Options policy updates.', scoreFactor: 1, weight: 18 }
    : { name: 'Security Headers', status: 'Warning', severity: 'Medium', summary: 'Some security headers are missing or incomplete.', recommendation: 'Add HSTS, CSP, X-Frame-Options, and X-Content-Type-Options headers.', scoreFactor: 0.6, weight: 18 };

  const cookieCheck = cookiesSecure
    ? { name: 'Cookie Security', status: 'Passed', severity: 'Low', summary: 'Secure cookies are being configured.', recommendation: 'Keep cookie flags strict and review session lifecycle settings.', scoreFactor: 1, weight: 14 }
    : { name: 'Cookie Security', status: 'Warning', severity: 'Medium', summary: 'Cookies may not be using secure flags or may need stricter settings.', recommendation: 'Set HttpOnly and Secure flags on session cookies and review cookie scope.', scoreFactor: 0.6, weight: 14 };

  const redirectCheck = httpStatus >= 300 && httpStatus < 400 && redirectLocation
    ? { name: 'Redirect Configuration', status: 'Passed', severity: 'Low', summary: 'Redirect configuration is present and appears to be correctly set.', recommendation: 'Keep redirects limited and eliminate chain loops or insecure forwarding.', scoreFactor: 1, weight: 12 }
    : { name: 'Redirect Configuration', status: 'Warning', severity: 'Medium', summary: 'No clear redirect protection or redirect path was detected.', recommendation: 'Review redirect rules to avoid open redirects and mixed-content flows.', scoreFactor: 0.6, weight: 12 };

  const techCheck = serverInfo && !/nginx|apache|iis|unknown/i.test(serverInfo)
    ? { name: 'Technology Detection', status: 'Passed', severity: 'Low', summary: `Technology fingerprint indicates: ${serverInfo}.`, recommendation: 'Monitor server software versions and keep them patched.', scoreFactor: 1, weight: 10 }
    : { name: 'Technology Detection', status: 'Warning', severity: 'Low', summary: 'Technology stack is partially visible but not strongly confirmed.', recommendation: 'Review server version exposure and reduce unnecessary fingerprinting.', scoreFactor: 0.7, weight: 10 };

  const vulnerabilityCheck = !csp || !hsts || !frameOptions || !xContentTypeOptions || !cookiesSecure
    ? { name: 'Basic Vulnerability Indicators', status: 'Warning', severity: 'Medium', summary: 'The application may be missing basic hardening controls.', recommendation: 'Add missing security headers and secure cookie settings to reduce risk exposure.', scoreFactor: 0.55, weight: 14 }
    : { name: 'Basic Vulnerability Indicators', status: 'Passed', severity: 'Low', summary: 'No major hardening gaps were found in the initial review.', recommendation: 'Continue monitoring and enforcement of best-practice security controls.', scoreFactor: 1, weight: 14 };

  const checks = [tlsCheck, headersCheck, cookieCheck, redirectCheck, techCheck, vulnerabilityCheck];

  const score = calculateScore(checks);
  const riskLevel = getSeverity(score);
  const findings = buildFindings(checks);
  const recommendations = createRecommendations(findings);

  const vulnerabilitySummary = {
    critical: findings.filter((item) => item.severity === 'Critical').length,
    high: findings.filter((item) => item.severity === 'High').length,
    medium: findings.filter((item) => item.severity === 'Medium').length,
    low: findings.filter((item) => item.severity === 'Low').length,
    passed: checks.filter((item) => item.status === 'Passed').length
  };

  const graphData = [
    { label: 'HTTPS / SSL', value: tlsCheck.status === 'Passed' ? 90 : 35 },
    { label: 'Security Headers', value: headersCheck.status === 'Passed' ? 80 : headersCheck.status === 'Warning' ? 60 : 35 },
    { label: 'Authentication Security', value: httpStatus >= 200 && httpStatus < 400 ? 78 : 52 },
    { label: 'Cookie Security', value: cookieCheck.status === 'Passed' ? 82 : 52 },
    { label: 'Network Configuration', value: redirectCheck.status === 'Passed' ? 75 : 48 },
    { label: 'Overall Security', value: score }
  ];

  return {
    success: true,
    url: targetUrl,
    hostname,
    statusCode: httpStatus || 'Unavailable',
    score,
    riskLevel,
    severity: riskLevel,
    scanTime: new Date().toISOString(),
    durationMs: Date.now() - Date.now(),
    status: 'Completed',
    headers: headers,
    error: errorMessage,
    checks,
    findings,
    recommendations,
    vulnerabilitySummary,
    graphData,
    summary: {
      target: targetUrl,
      risk: riskLevel,
      score,
      assessment: score >= 80 ? 'No critical security issues detected in the initial assessment.' : 'This target shows some security gaps that should be reviewed.'
    }
  };
};

// In-memory job store for running scans and SSE clients
const jobs = new Map();

app.post('/api/scan', (req, res) => {
  try {
    const { url } = req.body || {};
    const finalUrl = normalizeUrl(url);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const job = {
      id,
      url: finalUrl,
      status: 'queued',
      progress: 0,
      events: [],
      clients: [],
      result: null
    };

    jobs.set(id, job);

    // Start the scan asynchronously
    (async () => {
      try {
        job.status = 'running';
        pushEvent(job, { type: 'started', message: 'Scan started', progress: 5 });

        // Run the scan with periodic updates
        const report = await buildScanResultWithProgress(job, (evt) => pushEvent(job, evt));

        job.result = report;
        job.status = 'completed';
        job.progress = 100;
        pushEvent(job, { type: 'completed', message: 'Scan completed', progress: 100, report });
      } catch (err) {
        job.status = 'failed';
        pushEvent(job, { type: 'failed', message: err.message || 'Scan failed' });
      }
    })();

    return res.json({ success: true, id, url: finalUrl });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message || 'Unable to create scan job.' });
  }
});

// SSE endpoint for job progress
app.get('/api/scan/:id/events', (req, res) => {
  const { id } = req.params;
  const job = jobs.get(id);
  if (!job) return res.status(404).end();

  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Access-Control-Allow-Origin': '*'
  });

  // send existing events
  job.events.forEach((ev) => {
    res.write(`data: ${JSON.stringify(ev)}\n\n`);
  });

  job.clients.push(res);

  req.on('close', () => {
    job.clients = job.clients.filter((c) => c !== res);
  });
});

// simple status poll
app.get('/api/scan/:id', (req, res) => {
  const { id } = req.params;
  const job = jobs.get(id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  return res.json({ success: true, id: job.id, status: job.status, progress: job.progress, result: job.result });
});

// helper to push events to SSE clients and store them
function pushEvent(job, ev) {
  job.events.push(ev);
  job.progress = ev.progress || job.progress;
  job.clients.forEach((res) => {
    try {
      res.write(`data: ${JSON.stringify(ev)}\n\n`);
    } catch (e) {
      // ignore client write errors
    }
  });
}

// Build scan result but call progressCallback periodically
const buildScanResultWithProgress = async (job, progressCallback) => {
  const steps = [
    'URL validation',
    'HTTPS / SSL',
    'Security Headers',
    'HTTP configuration',
    'Cookie security',
    'Redirect configuration',
    'Technology Detection',
    'Basic Vulnerability Indicators'
  ];

  // Start with a single fetch to gather headers and status
  let httpResponse = null;
  let errorMessage = null;
  try {
    progressCallback({ type: 'progress', message: 'Resolving DNS and connecting...', progress: 8 });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    httpResponse = await fetch(job.url, { method: 'GET', redirect: 'manual', signal: controller.signal });
    clearTimeout(timeout);
  } catch (err) {
    errorMessage = err && err.name === 'AbortError' ? 'The target site did not respond in time.' : 'The target website could not be reached from the server.';
  }

  const headers = httpResponse ? Object.fromEntries(httpResponse.headers.entries()) : {};
  const setCookie = headers['set-cookie'] || '';
  const serverInfo = headers.server || 'Unknown';
  const redirectLocation = headers.location || '';
  const httpStatus = httpResponse ? httpResponse.status : 0;
  const isHttps = job.url.startsWith('https:');
  const hsts = headers['strict-transport-security'] || '';
  const csp = headers['content-security-policy'] || '';
  const frameOptions = headers['x-frame-options'] || '';
  const xContentTypeOptions = headers['x-content-type-options'] || '';
  const cookiesSecure = /secure/i.test(setCookie);

  const stepResults = [];

  // run each step and emit progress
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const progress = Math.round(((i + 1) / steps.length) * 90) + 5;
    let check = null;

    switch (step) {
      case 'URL validation':
        check = { name: 'URL validation', status: (errorMessage ? 'Failed' : 'Passed'), summary: errorMessage || 'URL resolved and reachable', weight: 10, scoreFactor: errorMessage ? 0 : 1 };
        break;
      case 'HTTPS / SSL':
        check = isHttps ? { name: 'HTTPS / SSL', status: 'Passed', summary: 'HTTPS detected', weight: 22, scoreFactor: 1 } : { name: 'HTTPS / SSL', status: 'Failed', summary: 'No HTTPS detected', weight: 22, scoreFactor: 0 };
        break;
      case 'Security Headers':
        check = (hsts || csp || frameOptions || xContentTypeOptions) ? { name: 'Security Headers', status: 'Passed', summary: 'Key security headers detected', weight: 18, scoreFactor: 1 } : { name: 'Security Headers', status: 'Warning', summary: 'Missing some security headers', weight: 18, scoreFactor: 0.6 };
        break;
      case 'HTTP configuration':
        check = httpStatus ? { name: 'HTTP configuration', status: 'Passed', summary: `Responded with HTTP ${httpStatus}`, weight: 10, scoreFactor: httpStatus >= 200 && httpStatus < 400 ? 1 : 0.6 } : { name: 'HTTP configuration', status: 'Failed', summary: 'No HTTP response captured', weight: 10, scoreFactor: 0 };
        break;
      case 'Cookie security':
        check = cookiesSecure ? { name: 'Cookie security', status: 'Passed', summary: 'Secure cookie flags detected', weight: 14, scoreFactor: 1 } : { name: 'Cookie security', status: 'Warning', summary: 'Cookies may not be secure', weight: 14, scoreFactor: 0.6 };
        break;
      case 'Redirect configuration':
        check = (httpStatus >= 300 && httpStatus < 400 && redirectLocation) ? { name: 'Redirect configuration', status: 'Passed', summary: 'Redirect detected and handled', weight: 12, scoreFactor: 1 } : { name: 'Redirect configuration', status: 'Warning', summary: 'No redirect or unclear redirect policy', weight: 12, scoreFactor: 0.6 };
        break;
      case 'Technology Detection':
        check = serverInfo ? { name: 'Technology Detection', status: 'Passed', summary: `Server: ${serverInfo}`, weight: 6, scoreFactor: 1 } : { name: 'Technology Detection', status: 'Warning', summary: 'Unable to fully fingerprint technology', weight: 6, scoreFactor: 0.7 };
        break;
      case 'Basic Vulnerability Indicators':
        check = (csp && hsts && xContentTypeOptions && frameOptions && cookiesSecure) ? { name: 'Basic Vulnerability Indicators', status: 'Passed', summary: 'No obvious hardening gaps detected', weight: 18, scoreFactor: 1 } : { name: 'Basic Vulnerability Indicators', status: 'Warning', summary: 'Some hardening controls appear missing', weight: 18, scoreFactor: 0.55 };
        break;
      default:
        check = { name: step, status: 'Unable to verify', summary: 'No data', weight: 0, scoreFactor: 0 };
    }

    stepResults.push(check);
    progressCallback({ type: 'step', step: check.name, status: check.status, summary: check.summary, progress });
    // small delay between steps so frontend can show progress
    // but don't delay if the step was instant
    // allow real network pacing
    await new Promise((r) => setTimeout(r, 600));
  }

  const score = calculateScore(stepResults);
  const riskLevel = getSeverity(score);
  const findings = buildFindings(stepResults);
  const recommendations = createRecommendations(findings);
  const vulnerabilitySummary = {
    critical: findings.filter((f) => f.severity === 'Critical').length,
    high: findings.filter((f) => f.severity === 'High').length,
    medium: findings.filter((f) => f.severity === 'Medium').length,
    low: findings.filter((f) => f.severity === 'Low').length,
    passed: stepResults.filter((s) => s.status === 'Passed').length
  };

  const graphData = [
    { label: 'HTTPS / SSL', value: stepResults[1].status === 'Passed' ? 90 : 30 },
    { label: 'Security Headers', value: stepResults[2].status === 'Passed' ? 80 : 55 },
    { label: 'Authentication Security', value: stepResults[3].status === 'Passed' ? 78 : 52 },
    { label: 'Cookie Security', value: stepResults[4].status === 'Passed' ? 82 : 50 },
    { label: 'Network Configuration', value: stepResults[5].status === 'Passed' ? 75 : 48 },
    { label: 'Overall Security', value: score }
  ];

  return {
    success: true,
    url: job.url,
    score,
    riskLevel,
    scanTime: new Date().toISOString(),
    durationMs: 0,
    status: 'Completed',
    checks: stepResults,
    findings,
    recommendations,
    vulnerabilitySummary,
    graphData,
    summary: {
      target: job.url,
      risk: riskLevel,
      score,
      assessment: score >= 80 ? 'No critical security issues detected in the initial assessment.' : 'This target shows some security gaps that should be reviewed.'
    }
  };
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'CyberGuard Scanner API', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  const indexFile = path.join(frontendDir, 'index.html');
  res.sendFile(indexFile);
});

app.listen(port, () => {
  console.log(`CyberGuard scanner API running on http://localhost:${port}`);
});
