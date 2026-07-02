"use client";

import { motion } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <h2 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">
              automate?
            </span>
          </h2>

          <p className="text-xl text-text-2 max-w-2xl mx-auto leading-relaxed">
            Join companies scaling their teams with AI. Start free. Pay only when you scale.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <SignUpButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/50 transition"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </SignUpButton>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-bold text-lg hover:bg-primary/10 transition"
            >
              Book Demo
            </motion.button>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-text-3 text-sm pt-4"
          >
            No credit card required. Full access for 14 days.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
