"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 · Page not found";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-glow-radial" />

      <div className="relative z-10 max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 sm:p-8 font-mono text-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="size-3 rounded-full bg-red-400/80" />
            <span className="size-3 rounded-full bg-yellow-400/80" />
            <span className="size-3 rounded-full bg-brand-glow/80" />
            <span className="ml-2 text-text-muted">terminal</span>
          </div>

          <p className="text-text-brand mb-2">$ curl /this-page</p>
          <p className="text-red-400/90 mb-1">
            &gt; 404: page not found
          </p>
          <p className="text-text-muted mb-6">
            &gt; the page you&apos;re looking for has moved, vanished, or never existed.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/zh"
              className="px-4 py-2 rounded-lg bg-brand-primary/15 border border-brand-primary/30 text-text-brand hover:bg-brand-primary/25 transition-colors"
            >
              cd ~/home
            </Link>
            <Link
              href="/zh/blog"
              className="px-4 py-2 rounded-lg border border-white/10 text-text-secondary hover:text-text-primary hover:border-brand-primary/40 transition-colors"
            >
              ls ~/blog
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
