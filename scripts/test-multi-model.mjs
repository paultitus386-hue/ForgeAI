// ============================================================
// ForgeAI — Multi-Model Integration Test Suite
// Verifies ModelRegistry, ModelRouter, Fallback, API routes,
// and Provider selection.
// ============================================================

import assert from 'node:assert';

console.log('🧪 Starting ForgeAI Multi-Model Integration Tests...\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

// ------------------------------------------------------------
// 1. Model Registry Tests
// ------------------------------------------------------------
console.log('📦 1. Testing Model Registry...');

const { INITIAL_MODELS, ModelRegistry } = await import('../src/lib/model-registry.ts');

test('ModelRegistry contains required initial models', () => {
  const models = ModelRegistry.getAll();
  assert(models.length >= 4, 'Should contain at least 4 models');

  const gpt6 = ModelRegistry.getById('openai/gpt-6-astra');
  assert(gpt6, 'GPT-6 Astra must be registered');
  assert.strictEqual(gpt6.displayName, 'GPT-6 Astra');
  assert.strictEqual(gpt6.modelId, 'gpt-6-astra');
  assert.strictEqual(gpt6.capabilities.supportsComputerUse, true, 'GPT-6 Astra supports computer use');

  const fable5 = ModelRegistry.getById('anthropic/claude-fable-5');
  assert(fable5, 'Claude Fable 5 must be registered');
  assert.strictEqual(fable5.displayName, 'Claude Fable 5');
  assert.strictEqual(fable5.modelId, 'claude-fable-5');
  assert.strictEqual(fable5.capabilities.supportsCode, true, 'Claude Fable 5 supports code');

  const gemini = ModelRegistry.getById('gemini/gemini-2.0-flash');
  assert(gemini, 'Gemini 2.0 Flash must be registered');
  assert.strictEqual(gemini.provider, 'gemini');
});

test('ModelRegistry filters by provider correctly', () => {
  const openaiModels = ModelRegistry.getByProvider('openai');
  assert(openaiModels.every((m) => m.provider === 'openai'));

  const anthropicModels = ModelRegistry.getByProvider('anthropic');
  assert(anthropicModels.every((m) => m.provider === 'anthropic'));

  const geminiModels = ModelRegistry.getByProvider('gemini');
  assert(geminiModels.every((m) => m.provider === 'gemini'));
});

// ------------------------------------------------------------
// 2. Model Router & Auto Mode Tests
// ------------------------------------------------------------
console.log('\n🧠 2. Testing Model Router & Auto Routing...');

const { ModelRouter } = await import('../src/lib/model-router.ts');

test('ModelRouter estimates requirements accurately', () => {
  const archReq = ModelRouter.estimateTaskRequirements(
    'Design a scalable distributed architecture system for high-concurrency microservices'
  );
  assert.strictEqual(archReq.category, 'architecture');
  assert.strictEqual(archReq.complexity, 'high');
  assert.strictEqual(archReq.needsReasoning, true);

  const debugReq = ModelRouter.estimateTaskRequirements(
    'Fix broken error in App.tsx failing build'
  );
  assert.strictEqual(debugReq.category, 'debugging');

  const googleReq = ModelRouter.estimateTaskRequirements(
    'Integrate Google Firebase and Gemini analytics'
  );
  assert(googleReq.recommendedModelId.includes('gemini'));
});

test('ModelRouter selects user-requested model when specified', () => {
  const decision = ModelRouter.selectModel('Build an API', {
    requestedModelId: 'anthropic/claude-fable-5',
    isAuto: false,
  });
  assert.strictEqual(decision.selectedModel.displayName, 'Claude Fable 5');
  assert.strictEqual(decision.isAuto, false);
});

test('ModelRouter handles Auto mode intelligently', () => {
  const decision = ModelRouter.selectModel('Perform full-scale multi-file refactoring across project', {
    isAuto: true,
    fileCount: 8,
  });
  assert(decision.isAuto === true);
  assert(decision.selectedModel !== null);
  assert(decision.reasoning.length > 0);
});

// ------------------------------------------------------------
// 3. Fallback System Tests
// ------------------------------------------------------------
console.log('\n🔄 3. Testing Fallback System...');

test('ModelRouter handles fallback smoothly', () => {
  const fallbackChain = ['anthropic/claude-fable-5', 'gemini/gemini-2.0-flash'];
  const res = ModelRouter.handleFallback('openai/gpt-6-astra', fallbackChain);

  assert(res.fallbackModel !== null);
  assert.strictEqual(res.fallbackModel.displayName, 'Claude Fable 5');
  assert(res.notificationMessage.includes('GPT-6 Astra unavailable'));
  assert(res.notificationMessage.includes('Claude Fable 5'));
});

test('ModelRouter informs user when all models in fallback chain fail', () => {
  const attempted = new Set(['openai/gpt-6-astra', 'anthropic/claude-fable-5', 'gemini/gemini-2.0-flash']);
  const res = ModelRouter.handleFallback('gemini/gemini-2.0-flash', ['openai/gpt-6-astra', 'anthropic/claude-fable-5'], attempted);

  assert.strictEqual(res.fallbackModel, null);
  assert(res.notificationMessage.includes('All configured models'));
});

// ------------------------------------------------------------
// 4. API Endpoints Tests (HTTP)
// ------------------------------------------------------------
console.log('\n🌐 4. Testing Backend API Routes (Server must be running on :3000)...');

await asyncTest('POST /api/llm/test returns 400 when missing key', async () => {
  const res = await fetch('http://localhost:3000/api/llm/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'openai', apiKey: '' }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.valid, false);
});

await asyncTest('POST /api/llm/anthropic returns 401 when missing key', async () => {
  const res = await fetch('http://localhost:3000/api/llm/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
  });
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert(data.message.includes('No Anthropic API key'));
});

await asyncTest('POST /api/llm/openai returns 401 when missing key', async () => {
  const res = await fetch('http://localhost:3000/api/llm/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
  });
  assert.strictEqual(res.status, 401);
});

await asyncTest('POST /api/llm/gemini returns 401 when missing key', async () => {
  const res = await fetch('http://localhost:3000/api/llm/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
  });
  assert.strictEqual(res.status, 401);
});

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
console.log(`\n============================================================`);
console.log(`📊 Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log(`============================================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
