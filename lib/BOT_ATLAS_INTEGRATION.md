# Bot Atlas Integration Guide

All bots MUST use Atlas for research and support. This ensures consistent knowledge sharing and automatic troubleshooting.

## Quick Start

```javascript
const { askAtlas, getAtlasSupport } = require('../lib/atlas-helper');
```

## When to Call Atlas

### 1. **Research & Knowledge Queries**
Call `askAtlas()` whenever you need to look up information:

**Examples:**
- Dan (Marketing): "What are the best wholesale pricing strategies for natural fiber products?"
- Dave (Finance): "What's the standard payment terms for wholesale B2B transactions?"
- Annie (Support): "How do I handle a customer complaint about product quality?"
- Jordan (Legal): "What are the requirements for wholesale supplier contracts?"

```javascript
// Inside your bot handler
const result = await askAtlas(
  'What are the best wholesale pricing strategies?',
  'marketing',  // Your bot's domain
  tenantId
);

if (result.success) {
  console.log('Atlas says:', result.answer);
  // Use result.answer in your logic
}
```

### 2. **Error Support**
Call `getAtlasSupport()` whenever your bot encounters an error:

```javascript
try {
  // Your bot logic here
  const data = await database.query('...');
} catch (error) {
  console.error('[My Bot] Error:', error);

  // Get Atlas support
  const support = await getAtlasSupport(
    'Database query failed in bot operation',
    tenantId,
    {
      error: error.message,
      stack: error.stack,
      context: { operation: 'fetchLeads', query: 'SELECT...' }
    }
  );

  if (support.success) {
    console.log('[Atlas Support]', support.solution);
    // Log or use the solution
  }

  // Return error with Atlas guidance
  return {
    success: false,
    error: error.message,
    atlas_solution: support.solution
  };
}
```

### 3. **Decision Making**
Use `askAtlasDecision()` for yes/no questions:

```javascript
const decision = await askAtlasDecision(
  'Should we send a follow-up email to this lead?',
  'marketing',
  tenantId
);

if (decision.decision === 'yes') {
  // Send the email
  console.log('Reason:', decision.reasoning);
}
```

## Context Categories by Bot

Use the correct context for your bot:

| Bot | Context | Description |
|-----|---------|-------------|
| **Henry** | `operations` | Chief of Staff - strategic planning, goals |
| **Dave** | `finance` | Accountant - pricing, proposals, payments |
| **Dan** | `marketing` | Marketing - leads, outreach, campaigns |
| **Jordan** | `legal` | Legal - compliance, contracts, risk |
| **Annie** | `support` | Customer Support - tickets, onboarding |
| **Alex** | `engineering` | Engineering - monitoring, debugging |
| **Atlas** | `general` | Knowledge synthesis |

## Best Practices

### DO:
✅ Call Atlas for ANY research needs
✅ Call Atlas when errors occur
✅ Use appropriate context category
✅ Log Atlas responses
✅ Include error details when asking for support

### DON'T:
❌ Make assumptions without checking Atlas first
❌ Ignore Atlas support recommendations
❌ Use wrong context category
❌ Skip Atlas when encountering errors
❌ Duplicate research (Atlas caches responses)

## Complete Example: Dan Marketing Bot

```javascript
const { askAtlas, getAtlasSupport } = require('../lib/atlas-helper');

async function danAutoOutreach(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  try {
    // 1. Ask Atlas for best practices
    const strategy = await askAtlas(
      'What email subject lines have highest open rates for B2B wholesale outreach?',
      'marketing',
      tenantId
    );

    if (strategy.success) {
      console.log('[Dan] Using Atlas strategy:', strategy.answer);
    }

    // 2. Your bot logic
    const leads = await fetchLeads(tenantId);
    const results = await sendOutreachEmails(leads, strategy.answer);

    return res.json({
      success: true,
      emails_sent: results.length,
      strategy_used: strategy.answer
    });

  } catch (error) {
    console.error('[Dan] Outreach error:', error);

    // 3. Get Atlas support for errors
    const support = await getAtlasSupport(
      'Auto outreach campaign failed',
      tenantId,
      {
        error: error.message,
        stack: error.stack,
        context: { leads_count: leads?.length }
      }
    );

    return res.status(500).json({
      success: false,
      error: error.message,
      atlas_support: support.solution
    });
  }
}
```

## Atlas Response Format

### askAtlas()
```javascript
{
  success: true,
  answer: "Based on research...",
  sources: ['gemini', 'claude'],
  cached: false
}
```

### getAtlasSupport()
```javascript
{
  success: true,
  solution: "Root cause: ...\n\nSolution:\n1. ...\n2. ...",
  sources: ['claude']
}
```

### askAtlasDecision()
```javascript
{
  success: true,
  decision: 'yes',  // 'yes', 'no', or 'maybe'
  reasoning: "You should do this because..."
}
```

## Integration Checklist

For EACH bot, ensure:

- [ ] Imports `askAtlas` and `getAtlasSupport` from `lib/atlas-helper`
- [ ] Calls `askAtlas()` for any research/knowledge needs
- [ ] Calls `getAtlasSupport()` in ALL catch blocks
- [ ] Uses correct context category for the bot's domain
- [ ] Logs Atlas responses for debugging
- [ ] Returns Atlas solutions in error responses
- [ ] Documents what Atlas calls are made and why

## Testing Atlas Integration

```javascript
// Test research
const test1 = await askAtlas('What is 2+2?', 'general', tenantId);
console.log('Answer:', test1.answer);

// Test support
const test2 = await getAtlasSupport(
  'Test error',
  tenantId,
  { error: 'Test error message' }
);
console.log('Solution:', test2.solution);

// Test decision
const test3 = await askAtlasDecision(
  'Is the sky blue?',
  'general',
  tenantId
);
console.log('Decision:', test3.decision, test3.reasoning);
```

---

**Remember:** Atlas is your knowledge engine. Use it liberally!
