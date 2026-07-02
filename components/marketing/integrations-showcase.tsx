"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const integrations = [
  // CRM & Sales
  { name: "Salesforce", category: "CRM", icon: "🏢" },
  { name: "HubSpot", category: "CRM", icon: "🎯" },
  { name: "Pipedrive", category: "CRM", icon: "📊" },

  // Communication
  { name: "Slack", category: "Comms", icon: "💬" },
  { name: "Microsoft Teams", category: "Comms", icon: "👥" },
  { name: "Gmail", category: "Email", icon: "📧" },

  // Productivity
  { name: "Notion", category: "Docs", icon: "📝" },
  { name: "Airtable", category: "Data", icon: "📋" },
  { name: "Google Sheets", category: "Data", icon: "📊" },

  // AI & Search
  { name: "Perplexity", category: "Search", icon: "🔍" },
  { name: "OpenAI", category: "AI", icon: "🤖" },
  { name: "Claude", category: "AI", icon: "🧠" },

  // Commerce
  { name: "Stripe", category: "Payments", icon: "💳" },
  { name: "Shopify", category: "Ecommerce", icon: "🛍️" },
  { name: "Square", category: "Payments", icon: "◻️" },
];

export function IntegrationsShowcase() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-bg-primary">
      {/* Background elements */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Connect to <span className="text-secondary">Everything</span>
          </h2>
          <p className="text-lg text-text-2 max-w-2xl mx-auto">
            Pre-built integrations with 15+ tools. More coming every week.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group"
            >
              <div className="relative rounded-xl p-6 border border-border bg-surface/40 backdrop-blur hover:border-primary/50 transition duration-300 text-center h-full flex flex-col items-center justify-center gap-3">
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />

                <div className="text-3xl">{integration.icon}</div>
                <div className="relative z-10">
                  <p className="font-semibold text-sm">{integration.name}</p>
                  <p className="text-text-3 text-xs">{integration.category}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add custom integration card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: integrations.length * 0.05 }}
            className="group"
          >
            <div className="relative rounded-xl p-6 border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur hover:border-primary transition duration-300 text-center h-full flex flex-col items-center justify-center gap-3 cursor-pointer">
              <Plus className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold text-sm">Add Custom</p>
                <p className="text-text-3 text-xs">Via Webhook</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-text-2 mb-6">Need a specific integration? We can add it.</p>
          <button className="px-8 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition font-semibold">
            Request Integration
          </button>
        </motion.div>
      </div>
    </section>
  );
}
