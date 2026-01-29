"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, CheckCircle, GraduationCap, Clock,
  MessageCircle, Star, ArrowRight, ArrowUpRight
} from "lucide-react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Find a Tutor", href: "/dashboard/student/teachers" },
    { name: "Become a Tutor", href: "/register/teacher" },
    { name: "Login", href: "/login" },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">

      {/* Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 h-20 ${scrolled
            ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm"
            : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-full relative overflow-visible">
          {/* Logo */}
          <Link href="/" className="flex items-center relative z-10 group overflow-visible">
            <div className="relative flex items-center justify-center overflow-visible">
              {/* Glow behind logo */}
              <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity rounded-full" />
              {/* Actual logo */}
              <img
                src="/logo.png"
                alt="Logo"
                className="h-32 md:h-44 w-auto relative z-10"
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold tracking-wide transition-colors relative group ${scrolled || mobileMenuOpen
                    ? "text-slate-600 hover:text-indigo-600"
                    : "text-white/90 hover:text-white"
                  }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
              </Link>
            ))}
            <Link
              href="/register"
              className={`px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all transform hover:scale-105 hover:shadow-lg ${scrolled
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30"
                }`}
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden focus:outline-none transition-colors ${scrolled || mobileMenuOpen ? "text-slate-900" : "text-white"
              }`}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <nav className="flex flex-col p-6 gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-slate-800 py-2 border-b border-slate-50"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 text-center w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200"
                >
                  Get Started Now
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        {/* Cinematic Backdrop */}
        <div className="absolute inset-0 z-0 bg-slate-900">
          <video
            className="absolute w-full h-full object-cover opacity-60"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/landingPage.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/10" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white mt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-semibold mb-6 backdrop-blur-md">
              ✨ The Future of Learning is Here
            </span>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-tight">
              Master Any Subject, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                Without Limits.
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with verified experts for 1-on-1 personalized tutoring.
              Elevate your skills online or in-person, on your schedule.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link href="/dashboard/student/teachers">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-shadow overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Find a Tutor <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </Link>

              <Link href="/register/teacher">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-full font-bold text-lg text-white border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  Become a Tutor
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Why We Are <span className="text-indigo-600">Legendary</span>
            </h2>
            <p className="text-lg text-slate-600">
              We don't just connect you with tutors; we provide an ecosystem for excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8 text-blue-500" />}
              title="Verified Experts"
              description="Every tutor passes a rigorous vetting process. Quality isn't an option; it's a guarantee."
              delay={0.1}
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-pink-500" />}
              title="Flexible & Freelance"
              description="Learn on your terms. Late night? Early morning? Our global network is always awake."
              delay={0.2}
            />
            <FeatureCard
              icon={<MessageCircle className="w-8 h-8 text-indigo-500" />}
              title="Instant Help"
              description="Stuck on a problem using? Post a request and get matched with a helper in minutes."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">Success Stories</h2>
              <div className="h-1.5 w-24 bg-indigo-500 rounded-full" />
            </div>
            <p className="text-slate-500 max-w-sm text-right md:text-left">
              Join thousands of students who have transformed their grades and careers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Sarah K."
              role="University Student"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
              quote="This platform helped me ace my finals! The tutor was incredibly patient and knowledgeable."
              delay={0}
            />
            <TestimonialCard
              name="Ahmed R."
              role="High Schooler"
              image="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80"
              quote="I finally understand Calculus. The interactive whiteboard tools made all the difference."
              delay={0.1}
            />
            <TestimonialCard
              name="Priya M."
              role="Lifelong Learner"
              image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
              quote="Found a language partner in minutes. The community vibe here is unmatched."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-indigo-600/20 blur-[100px] rounded-full mix-blend-screen scale-150 animate-pulse" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Ready to Level Up?
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            Don't let another day pass without reaching your full potential.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 font-bold text-lg px-10 py-5 rounded-full hover:bg-indigo-50 transition-colors shadow-2xl"
            >
              Get Started Now <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="Logo" className="h-10 opacity-90" />
                <span className="text-xl font-bold text-white">Tutogogy</span>
              </Link>
              <p className="max-w-xs leading-relaxed">
                Empowering education through connection. We believe knowledge should be accessible to everyone, everywhere.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="/browse" className="hover:text-white transition-colors">Browse Tutors</Link></li>
                <li><Link href="/requests" className="hover:text-white transition-colors">Post a Request</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-900">
            <p className="text-sm">© {new Date().getFullYear()} Tutogogy. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              {/* Social placeholders */}
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Sub-components for cleaner code
function FeatureCard({ icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all border border-slate-100 group"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function TestimonialCard({ name, role, image, quote, delay }: { name: string, role: string, image: string, quote: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.5 }}
      className="bg-slate-50 p-8 rounded-3xl relative"
    >
      <div className="flex items-center gap-4 mb-6">
        <img src={image} alt={name} className="w-12 h-12 rounded-full object-cover" />
        <div>
          <h4 className="font-bold text-slate-900">{name}</h4>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{role}</p>
        </div>
      </div>
      <div className="flex gap-1 mb-4 text-amber-400">
        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="text-slate-700 italic">"{quote}"</p>
    </motion.div>
  );
}
