import { Button } from '@/components/ui/button';
import Link from 'next/link';

const categories = [
  {
    category: 'CRM & Sales',
    accent: 'text-primary',
    tools: ['Salesforce', 'HubSpot', 'Pipedrive', 'Close', 'Apollo', 'Outreach'],
  },
  {
    category: 'Communication',
    accent: 'text-secondary',
    tools: ['Slack', 'Microsoft Teams', 'Discord', 'Telegram', 'WhatsApp', 'SMS'],
  },
  {
    category: 'Productivity',
    accent: 'text-gold',
    tools: ['Google Workspace', 'Microsoft 365', 'Notion', 'Airtable', 'Linear', 'Asana'],
  },
  {
    category: 'AI Models',
    accent: 'text-accent',
    tools: ['Anthropic', 'OpenAI', 'Google Gemini', 'xAI', 'Perplexity', 'Cohere'],
  },
  {
    category: 'Automation',
    accent: 'text-primary',
    tools: ['Zapier', 'Make', 'IFTTT', 'n8n', 'Webhooks', 'Cron'],
  },
  {
    category: 'Data & Analytics',
    accent: 'text-secondary',
    tools: ['Google Analytics', 'Stripe', 'Segment', 'Mixpanel', 'Snowflake', 'BigQuery'],
  },
];

export default function IntegrationsPage() {
  return (
    <div className="relative space-y-24 py-24">
      {/* Hero */}
      <section className="container mx-auto px-6 text-center space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-xs uppercase tracking-[0.3em] text-text-secondary">
            50+ native integrations
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight">
          Connect to{' '}
          <span className="bg-gradient-to-r from-secondary via-gold to-accent bg-clip-text text-transparent">
            everything
          </span>
          .
        </h1>
        <p className="text-lg text-text-secondary">
          Native OAuth. Webhooks first-class. REST + GraphQL. Your agents work with every tool your
          business already relies on.
        </p>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6"
            >
              <div className={`text-xs uppercase tracking-[0.3em] ${cat.accent} mb-4`}>
                ── {cat.category}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cat.tools.map((tool) => (
                  <div
                    key={tool}
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm text-text-secondary hover:border-white/20 hover:text-text-primary transition"
                  >
                    {tool}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom */}
      <section className="container mx-auto px-6 max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-secondary/10 via-transparent to-accent/10 backdrop-blur-md p-10 text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-semibold">Don&apos;t see your tool?</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Our enterprise team builds custom integrations for any internal API or SaaS — typical
            turnaround is 5 business days.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/sign-up">
              <Button size="lg">Request integration</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
