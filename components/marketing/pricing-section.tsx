"use client";

import { motion } from "framer-motion";
import { CheckCircle, Zap } from "lucide-react";
import { SignUpButton } from "@clerk/nextjs";

const tiers = [
  {
    name: "RECRUIT",
    price: 97,
    description: "Perfect for getting started",
    features: [
      { text: "1 AI Agent", icon: true },
      { text: "3 Integrations", icon: true },
      { text: "2 AI Models", icon: true },
      { text: "500 monthly runs", icon: true },
      { text: "Email support", icon: true },
      { text: "Basic tasks", icon: false },
      { text: "Custom workflows", icon: false },
    ],
    gradient: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
  },
  {
    name: "OPERATOR",
    price: 497,
    description: "The obvious choice",
    features: [
      { text: "5 AI Agents", icon: true },
      { text: "10 Integrations", icon: true },
      { text: "5 AI Models", icon: true },
      { text: "5,000 monthly runs", icon: true },
      { text: "Priority support", icon: true },
      { text: "Advanced tasks", icon: true },
      { text: "Custom workflows", icon: false },
    ],
    gradient: "from-secondary/30 to-secondary/10",
    borderColor: "border-secondary/50",
    popular: true,
  },
  {
    name: "EMPIRE",
    price: 2497,
    description: "Maximum everything",
    features: [
      { text: "Unlimited Agents", icon: true },
      { text: "All 15+ Tools", icon: true },
      { text: "All 5 AI Models", icon: true },
      { text: "Unlimited runs", icon: true },
      { text: "Dedicated manager", icon: true },
      { text: "Custom workflows", icon: true },
      { text: "White-label", icon: true },
    ],
    gradient: "from-gold/20 to-gold/5",
    borderColor: "border-gold/50",
  },
];

export function PricingSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-surface/50">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            <span className="text-primary">Transparent</span> Pricing
          </h2>
          <p className="text-lg text-text-2 max-w-2xl mx-auto mb-8">
            No hidden fees. Cancel anytime. Save 2 months with annual billing.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`group relative ${tier.popular ? "md:scale-105" : ""}`}
            >
              {/* Popular badge */}
              {tier.popular && (
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </div>
                </motion.div>
              )}

              {/* Card */}
              <div
                className={`relative h-full rounded-2xl p-8 border-2 ${tier.borderColor} bg-gradient-to-br ${tier.gradient} backdrop-blur overflow-hidden group hover:shadow-2xl transition duration-500`}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-text-2 text-sm mb-6">{tier.description}</p>

                  <div className="mb-8">
                    <div className="text-5xl font-bold">
                      ${tier.price}
                      <span className="text-lg text-text-2 font-normal">/mo</span>
                    </div>
                    <p className="text-text-3 text-sm mt-2">Billed monthly</p>
                  </div>

                  <SignUpButton mode="modal">
                    <button
                      className={`w-full py-3 rounded-lg font-bold mb-8 transition duration-300 ${
                        tier.popular
                          ? "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-primary/50"
                          : "border-2 border-text-2 text-text-1 hover:bg-text-2/10"
                      }`}
                    >
                      Get Started
                    </button>
                  </SignUpButton>

                  <div className="space-y-4">
                    {tier.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            feature.icon ? "text-primary" : "text-text-3"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            feature.icon ? "text-text-1 font-medium" : "text-text-3 line-through"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center text-text-2"
        >
          <p className="text-sm">All plans include: 24/7 uptime • Enterprise security • Email support • API access</p>
        </motion.div>
      </div>
    </section>
  );
}
