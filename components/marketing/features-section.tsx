"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Gauge, Package, Globe, Clock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Deploy agents in seconds. No engineering required.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC2, encrypted tokens, audit logs, compliance ready.",
  },
  {
    icon: Gauge,
    title: "Fully Observable",
    description: "Real-time monitoring, error tracking, performance metrics.",
  },
  {
    icon: Package,
    title: "15+ Integrations",
    description: "Connect to every tool your business uses.",
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "Runs on enterprise infrastructure. Handles millions of tasks.",
  },
  {
    icon: Clock,
    title: "Always Available",
    description: "24/7 operation. Never sleeps. Never tires.",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Built for <span className="text-primary">Enterprise</span>
          </h2>
          <p className="text-lg text-text-2 max-w-2xl mx-auto">
            Production-grade infrastructure that scales with your business.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="relative rounded-xl p-6 border border-border/50 bg-surface/40 backdrop-blur hover:border-primary/50 transition duration-300">
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />

                  <div className="relative z-10">
                    <Icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-text-2 text-sm leading-relaxed">{feature.description}</p>
                  </div>

                  {/* Border glow */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
