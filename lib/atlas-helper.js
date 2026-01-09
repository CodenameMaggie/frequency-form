/**
 * Atlas Helper Library
 * Provides easy access to Atlas knowledge engine for all bots
 *
 * Usage:
 * const { askAtlas, getAtlasSupport } = require('../lib/atlas-helper');
 *
 * // For research/knowledge queries
 * const result = await askAtlas('What are the best wholesale pricing strategies?', 'marketing', tenantId);
 *
 * // For technical support/debugging
 * const help = await getAtlasSupport('How do I fix database connection errors?', tenantId, errorContext);
 */

const { queryAtlas } = require('../api/bots/atlas-knowledge');

/**
 * Ask Atlas to research something
 * All bots should use this when they need information looked up
 *
 * @param {string} query - The question to ask
 * @param {string} context - Category: 'marketing', 'finance', 'operations', 'legal', 'support', 'engineering'
 * @param {string} tenantId - Tenant ID
 * @param {object} options - Additional options (sources, save_to_memory)
 * @returns {Promise<object>} Atlas response with answer and sources
 */
async function askAtlas(query, context = 'general', tenantId, options = {}) {
  try {
    console.log(`[Atlas Helper] ${context.toUpperCase()} asking Atlas: "${query.substring(0, 60)}..."`);

    const result = await queryAtlas(query, context, tenantId, {
      sources: options.sources || ['gemini'], // Default to free Gemini
      save_to_memory: options.save_to_memory !== false, // Save by default
      ...options
    });

    if (result.success) {
      console.log(`[Atlas Helper] ✅ Atlas responded (${result.sources?.join(', ') || 'unknown sources'})`);
      return {
        success: true,
        answer: result.answer,
        sources: result.sources,
        cached: result.cached || false
      };
    } else {
      console.error(`[Atlas Helper] ❌ Atlas failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
        answer: null
      };
    }
  } catch (error) {
    console.error('[Atlas Helper] Error calling Atlas:', error);
    return {
      success: false,
      error: error.message,
      answer: null
    };
  }
}

/**
 * Get technical support from Atlas
 * Use this when a bot encounters an error or needs troubleshooting help
 *
 * @param {string} problem - Description of the problem
 * @param {string} tenantId - Tenant ID
 * @param {object} errorContext - Error details (stack trace, error message, etc.)
 * @returns {Promise<object>} Atlas troubleshooting guidance
 */
async function getAtlasSupport(problem, tenantId, errorContext = {}) {
  try {
    console.log(`[Atlas Helper] SUPPORT requested: "${problem.substring(0, 60)}..."`);

    // Build detailed support query
    let supportQuery = `TECHNICAL SUPPORT REQUEST:\n\nProblem: ${problem}\n\n`;

    if (errorContext.error) {
      supportQuery += `Error Message: ${errorContext.error}\n`;
    }

    if (errorContext.stack) {
      supportQuery += `Stack Trace: ${errorContext.stack.substring(0, 500)}\n`;
    }

    if (errorContext.context) {
      supportQuery += `Additional Context: ${JSON.stringify(errorContext.context)}\n`;
    }

    supportQuery += `\nPlease provide:
1. Root cause analysis
2. Step-by-step solution
3. Prevention strategies
4. Related documentation or resources`;

    const result = await queryAtlas(supportQuery, 'engineering', tenantId, {
      sources: ['claude'], // Use Claude for technical support
      save_to_memory: true
    });

    if (result.success) {
      console.log('[Atlas Helper] ✅ Atlas support provided solution');
      return {
        success: true,
        solution: result.answer,
        sources: result.sources
      };
    } else {
      console.error(`[Atlas Helper] ❌ Atlas support failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
        solution: 'Atlas support unavailable. Please check logs and retry.'
      };
    }
  } catch (error) {
    console.error('[Atlas Helper] Error getting support:', error);
    return {
      success: false,
      error: error.message,
      solution: 'Failed to contact Atlas support.'
    };
  }
}

/**
 * Quick yes/no decision from Atlas
 * Use when you need a simple decision or recommendation
 *
 * @param {string} question - Yes/no question
 * @param {string} context - Context category
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<object>} { decision: 'yes'|'no'|'maybe', reasoning: string }
 */
async function askAtlasDecision(question, context, tenantId) {
  try {
    const enhancedQuery = `${question}\n\nPlease answer with YES, NO, or MAYBE, followed by a brief explanation (1-2 sentences).`;

    const result = await askAtlas(enhancedQuery, context, tenantId, {
      sources: ['gemini'], // Fast, free decision-making
      save_to_memory: false // Don't save simple decisions
    });

    if (result.success) {
      const answer = result.answer.toLowerCase();
      let decision = 'maybe';

      if (answer.includes('yes') && !answer.includes('no')) {
        decision = 'yes';
      } else if (answer.includes('no') && !answer.includes('yes')) {
        decision = 'no';
      }

      return {
        success: true,
        decision,
        reasoning: result.answer
      };
    }

    return {
      success: false,
      decision: 'maybe',
      reasoning: 'Unable to get Atlas response'
    };
  } catch (error) {
    return {
      success: false,
      decision: 'maybe',
      reasoning: error.message
    };
  }
}

/**
 * Check if Atlas knows about a specific topic
 * Useful for determining if we have existing knowledge before researching
 *
 * @param {string} topic - Topic to check
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<boolean>} True if Atlas has knowledge on this topic
 */
async function hasAtlasKnowledge(topic, tenantId) {
  try {
    const result = await queryAtlas(
      `Do we have any stored knowledge about: ${topic}? Just answer YES or NO.`,
      'general',
      tenantId,
      { sources: [], save_to_memory: false } // Only check memory, don't query AI
    );

    return result.cached === true || (result.answer && result.answer.toLowerCase().includes('yes'));
  } catch (error) {
    return false;
  }
}

module.exports = {
  askAtlas,
  getAtlasSupport,
  askAtlasDecision,
  hasAtlasKnowledge
};
