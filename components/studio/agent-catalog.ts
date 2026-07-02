// Roles a hired agent can be assigned during onboarding, plus the sample
// activity lines used to simulate them working on the live dashboard.

export interface AgentRole {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  activity: string[];
}

export const AGENT_ROLES: AgentRole[] = [
  {
    id: 'sdr',
    name: 'SDR',
    tagline: 'Prospecting & outreach',
    icon: 'Handshake',
    activity: [
      'drafted a follow-up email to Acme Corp',
      'enriched 14 new leads from LinkedIn',
      'booked a discovery call for Thursday',
      'sent 22 personalized outreach messages',
      'flagged 3 hot leads for the sales team',
    ],
  },
  {
    id: 'support',
    name: 'Support',
    tagline: '24/7 customer care',
    icon: 'Headset',
    activity: [
      'resolved a billing question in 40s',
      'escalated a priority ticket to on-call',
      'answered 9 chat messages this hour',
      'updated the FAQ with a new answer',
      'closed ticket #4821 — customer satisfied',
    ],
  },
  {
    id: 'research',
    name: 'Research',
    tagline: 'Market & competitor intel',
    icon: 'Search',
    activity: [
      "summarized a competitor's new pricing page",
      'compiled a one-page brief on industry trends',
      "flagged a shift in a competitor's messaging",
      'pulled 5 data points for the strategy deck',
    ],
  },
  {
    id: 'content',
    name: 'Content',
    tagline: 'Writing & copy',
    icon: 'PenTool',
    activity: [
      "drafted this week's newsletter",
      'rewrote the landing page headline',
      'generated 3 social captions for review',
      'polished the product changelog',
    ],
  },
  {
    id: 'ops',
    name: 'Ops',
    tagline: 'Workflow & coordination',
    icon: 'Settings2',
    activity: [
      'synced calendar invites for the team',
      "reconciled last week's expense report",
      'updated the project tracker',
      "scheduled next sprint's planning call",
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    tagline: 'Data & reporting',
    icon: 'BarChart3',
    activity: [
      "built this week's revenue snapshot",
      'flagged an anomaly in the signup funnel',
      'refreshed the churn dashboard',
      'exported Q3 metrics for the board deck',
    ],
  },
];

export const NAME_POOL = ['Aria', 'Kai', 'Nova', 'Rex', 'Iris', 'Zane', 'Luna', 'Max', 'Sage', 'Rio'];

export interface DeployedAgent {
  id: string;
  roleId: string;
  name: string;
}

export function defaultAgents(count: number): DeployedAgent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `agent-${i}`,
    roleId: AGENT_ROLES[i % AGENT_ROLES.length].id,
    name: NAME_POOL[i % NAME_POOL.length],
  }));
}

export function roleById(id: string): AgentRole {
  return AGENT_ROLES.find(r => r.id === id) ?? AGENT_ROLES[0];
}
