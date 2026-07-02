import { router } from '../trpc';
import { agentsRouter } from './agents';
import { tasksRouter } from './tasks';
import { integrationsRouter } from './integrations';
import { subscriptionRouter } from './subscription';
import { organizationsRouter } from './organizations';
import { legalRouter } from './legal';
import {
  workflowsRouter,
  costsRouter,
  monitoringRouter,
  contractsRouter,
} from './automation';

export const appRouter = router({
  agents: agentsRouter,
  tasks: tasksRouter,
  integrations: integrationsRouter,
  subscription: subscriptionRouter,
  organizations: organizationsRouter,
  legal: legalRouter,
  workflows: workflowsRouter,
  costs: costsRouter,
  monitoring: monitoringRouter,
  contracts: contractsRouter,
});

export type AppRouter = typeof appRouter;
