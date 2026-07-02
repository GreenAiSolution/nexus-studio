"use client";

import { motion } from "framer-motion";
import { Brain, Mail, TrendingUp, Headphones, FileText, MessageSquare } from "lucide-react";

const agents = [
  {
    name: "Sales Dev Rep",
    icon: TrendingUp,
    description: "Finds leads, qualifies prospects, books meetings",
    color: "from-primary/20 to-primary/5",
    tools: ["LinkedIn", "HubSpot", "Gmail"],
  },
  {
    name: "Customer Support",
    icon: Headphones,
    description: "Handles tickets, escalates issues, delights customers",
    color: "from-secondary/20 to-secondary/5",
    tools: ["Slack", "Zendesk", "Knowledge Base"],
  },
  {
    name: "Content Creator",
    icon: FileText,
    description: "Researches, writes, publishes, measures engagement",
    color: "from-accent/20 to-accent/5",
    tools: ["Perplexity", "Medium", "Twitter"],
  },
  {
    name: "Research Analyst",
    icon: Brain,
    description: "Gathers intelligence, analyzes trends, generates reports",
    color: "from-gold/20 to-gold/5",
    tools: ["APIs", "Web Search", "Database"],
  },
];

export function AgentShowcase() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Meet Your <span className="text-primary">AI Workforce</span>
          </h2>
          <p className="text-lg text-text-2 max-w-2xl mx-auto">
            Pre-built agents for every department. Customize for your business. Deploy in minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {agents.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-100 transition duration-300 blur-xl`} />

                <div className="relative rounded-2xl p-8 border border-border bg-surface/40 backdrop-blur hover:border-primary/50 transition duration-300 overflow-hidden">
                  {/* Background glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-primary/10 group-hover:bg-primary/20 transition duration-300 -z-10" />

                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-xs font-mono text-text-3 bg-border/50 px-2 py-1 rounded">
                      AI-Powered
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition">{agent.name}</h3>
                  <p className="text-text-2 mb-6 leading-relaxed">{agent.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {agent.tools.map((tool) => (
                      <span
                        key={tool}
                        className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-text-2 mb-6">
            + 50+ more specialized agents. Build custom agents for anything.
          </p>
          <button className="px-8 py-3 rounded-lg border border-primary text-primary hover:bg-primary/10 transition font-semibold">
            Explore All Agents
          </button>
        </motion.div>
      </div>
    </section>
  );
}
