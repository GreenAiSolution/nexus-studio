import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { executeAgentTask, retryFailedTask } from '@/inngest/functions';
import {
  generateContractDraft,
  requestAttorneyReview,
  processAttorneyDecision,
  scanContractRisks,
} from '@/inngest/legal-functions';
import {
  createAgentLifecycle,
  executeTask,
  postTaskResultToSlack,
  processContract,
  optimizeCosts,
  syncIntegration,
  monitorHealth,
  executeAgentWithToolCalls,
} from '@/inngest/automation-functions';
import {
  startOAuth,
  handleOAuthCallback,
  syncSalesforce,
  refreshOAuthToken,
  cleanupExpiredOAuthStates,
  handleStripeWebhook,
  retryFailedSync,
  handleDeadLetterSync,
} from '@/inngest/integrations';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Legacy functions
    executeAgentTask,
    retryFailedTask,
    generateContractDraft,
    requestAttorneyReview,
    processAttorneyDecision,
    scanContractRisks,
    // Automation functions (Phase 1)
    createAgentLifecycle,
    executeTask,
    postTaskResultToSlack,
    processContract,
    optimizeCosts,
    syncIntegration,
    monitorHealth,
    executeAgentWithToolCalls,
    // Integration functions (Phase 2)
    startOAuth,
    handleOAuthCallback,
    syncSalesforce,
    refreshOAuthToken,
    cleanupExpiredOAuthStates,
    handleStripeWebhook,
    retryFailedSync,
    handleDeadLetterSync,
  ],
});
