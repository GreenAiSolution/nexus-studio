// NEXUS Studio catalog — the service menu shown inside the immersive 3D studio.
// Core plans are a single choice; add-on services stack on top of the plan.

export type BillingCadence = 'mo' | 'once';

export interface CorePlan {
  id: 'RECRUIT' | 'OPERATOR' | 'EMPIRE';
  name: string;
  tagline: string;
  price: number;
  cadence: BillingCadence;
  color: string;
  glow: string;
  features: string[];
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  cadence: BillingCadence;
  icon: string;
}

export const CORE_PLANS: CorePlan[] = [
  {
    id: 'RECRUIT',
    name: 'RECRUIT',
    tagline: 'Your first AI hire',
    price: 97,
    cadence: 'mo',
    color: '#00D4FF',
    glow: 'rgba(0,212,255,0.55)',
    features: ['1 autonomous agent', '3 integrations', '500 runs / month', 'Email support'],
  },
  {
    id: 'OPERATOR',
    name: 'OPERATOR',
    tagline: 'A full AI department',
    price: 497,
    cadence: 'mo',
    color: '#6C63FF',
    glow: 'rgba(108,99,255,0.6)',
    features: ['5 autonomous agents', '10 integrations', '5,000 runs / month', 'Priority support'],
  },
  {
    id: 'EMPIRE',
    name: 'EMPIRE',
    tagline: 'An unlimited AI workforce',
    price: 2497,
    cadence: 'mo',
    color: '#C9A84C',
    glow: 'rgba(201,168,76,0.6)',
    features: ['Unlimited agents', 'All 15+ tools', 'Unlimited runs', 'Dedicated success manager'],
  },
];

export const ADD_ONS: AddOn[] = [
  {
    id: 'premium-models',
    name: 'Premium Model Pack',
    description: 'Unlock Opus 4.8, GPT-4o & Gemini Ultra routing for every agent.',
    price: 149,
    cadence: 'mo',
    icon: 'Sparkles',
  },
  {
    id: 'white-glove',
    name: 'White-Glove Onboarding',
    description: 'A NEXUS strategist builds & tunes your first agents with you.',
    price: 999,
    cadence: 'once',
    icon: 'Crown',
  },
  {
    id: 'extra-seats',
    name: 'Team Seats · +3',
    description: 'Invite three teammates to co-pilot and monitor your agents.',
    price: 120,
    cadence: 'mo',
    icon: 'Users',
  },
  {
    id: 'priority-integrations',
    name: 'Priority Integration Setup',
    description: 'We wire Salesforce, Slack & HubSpot to your stack within 48h.',
    price: 299,
    cadence: 'once',
    icon: 'Plug',
  },
  {
    id: 'success-manager',
    name: '24/7 Dedicated Manager',
    description: 'A named human overseeing your fleet, around the clock.',
    price: 799,
    cadence: 'mo',
    icon: 'Headset',
  },
];

export interface Selection {
  planId: CorePlan['id'] | null;
  addOnIds: string[];
}

export function summarize(sel: Selection) {
  const plan = CORE_PLANS.find(p => p.id === sel.planId) ?? null;
  const addOns = ADD_ONS.filter(a => sel.addOnIds.includes(a.id));

  const monthly =
    (plan?.cadence === 'mo' ? plan.price : 0) +
    addOns.filter(a => a.cadence === 'mo').reduce((s, a) => s + a.price, 0);

  const oneTime = addOns.filter(a => a.cadence === 'once').reduce((s, a) => s + a.price, 0);

  return { plan, addOns, monthly, oneTime, dueToday: monthly + oneTime };
}
