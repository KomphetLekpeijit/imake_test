const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'worker', timestamp: new Date().toISOString() });
});

// Quick task - responds immediately
app.post('/api/v1/jobs/quick-task', (req, res) => {
  console.log('[quick-task] Received:', JSON.stringify(req.body));
  res.json({
    status: 'completed',
    task: 'quick-task',
    message: 'Quick task completed successfully',
    timestamp: new Date().toISOString(),
    receivedPayload: req.body,
  });
});

// Heavy process - simulates 3-5 second delay
app.post('/api/v1/jobs/heavy-process', (req, res) => {
  const delay = Math.floor(Math.random() * 3000) + 3000; // 3-5 seconds
  console.log(`[heavy-process] Processing for ${delay}ms...`);

  setTimeout(() => {
    res.json({
      status: 'completed',
      task: 'heavy-process',
      message: `Heavy process completed after ${delay}ms`,
      processingTimeMs: delay,
      timestamp: new Date().toISOString(),
      receivedPayload: req.body,
    });
  }, delay);
});

// Unstable task - 50% chance of failure
app.post('/api/v1/jobs/unstable-task', (req, res) => {
  const shouldFail = Math.random() > 0.5;
  console.log(`[unstable-task] Will ${shouldFail ? 'FAIL' : 'succeed'}`);

  if (shouldFail) {
    res.status(500).json({
      status: 'error',
      task: 'unstable-task',
      error: 'Random simulated failure',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      status: 'completed',
      task: 'unstable-task',
      message: 'Unstable task happened to succeed this time',
      timestamp: new Date().toISOString(),
      receivedPayload: req.body,
    });
  }
});

// Custom payload - echoes back the payload with processing
app.post('/api/v1/jobs/custom-payload', (req, res) => {
  console.log('[custom-payload] Received:', JSON.stringify(req.body));

  const receivedAt = new Date().toISOString();
  const processedData = {
    originalPayload: req.body,
    processedAt: receivedAt,
    transformations: {
      keys: Object.keys(req.body || {}),
      totalFields: Object.keys(req.body || {}).length,
    },
  };

  res.json({
    status: 'completed',
    task: 'custom-payload',
    message: 'Custom payload processed',
    result: processedData,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Worker service running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/v1/jobs/quick-task');
  console.log('  POST /api/v1/jobs/heavy-process');
  console.log('  POST /api/v1/jobs/unstable-task');
  console.log('  POST /api/v1/jobs/custom-payload');
});
