import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'phxgrowth',
  eventKey: process.env.INNGEST_EVENT_KEY ?? 'local',
  isDev: process.env.NODE_ENV !== 'production',
});
