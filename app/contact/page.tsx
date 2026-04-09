"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Mail, MapPin, Phone, Clock, Send, CheckCircle, Loader2, Sparkles } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#00FFB3]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#9B8FFF]/5 rounded-full blur-[140px]" />
      </div>

      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 text-center z-10">
        <div className="max-w-3xl mx-auto px-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FFB3]/10 rounded-full border border-[#00FFB3]/20">
            <Sparkles className="w-4 h-4 text-[#00FFB3]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00FFB3]">Get in Touch</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight" style={{ letterSpacing: "-0.01em" }}>
            We'd Love to <span className="text-[#00FFB3]">Hear From You</span>
          </h1>
          <p className="text-lg text-white/45 max-w-xl mx-auto leading-relaxed">
            Have questions? Send us a message and we'll respond within 24 hours.
          </p>
        </div>
      </section>

      {/* Main */}
      <section className="relative z-10 flex-1 pb-24">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-sm">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <h2 className="text-xl font-bold text-white mb-1">Send us a Message</h2>
                <p className="text-sm text-white/40 mb-8">Fill out the form below and our team will get back to you within 24 hours.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Full Name *</label>
                      <Input
                        name="name"
                        type="text"
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 text-white placeholder:text-white/20 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address *</label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 text-white placeholder:text-white/20 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Subject *</label>
                    <Input
                      name="subject"
                      type="text"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 text-white placeholder:text-white/20 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Message *</label>
                    <Textarea
                      name="message"
                      placeholder="Tell us more about your enquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 text-white placeholder:text-white/20 text-sm resize-none"
                    />
                  </div>

                  {status === "success" && (
                    <div className="flex items-center gap-3 p-4 bg-[#00FFB3]/10 border border-[#00FFB3]/20 rounded-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                      <CheckCircle className="w-5 h-5 text-[#00FFB3] shrink-0" />
                      <p className="text-sm text-[#00FFB3] font-semibold">Thank you! We'll get back to you within 24 hours.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center gap-2 h-12 px-8 bg-[#00FFB3] text-[#030305] font-black text-sm uppercase tracking-[0.15em] rounded-xl shadow-[0_8px_30px_-6px_rgba(0,255,179,0.35)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {status === "loading" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Message</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Contact info */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm space-y-6">
                <h2 className="text-base font-bold text-white">Contact Information</h2>

                {[
                  { icon: Mail,  title: "Email",            lines: ["support@ai-bytes.org", "admin@ai-bytes.org"] },
                  { icon: Phone, title: "Phone",            lines: ["+44 (0) 20 7946 0123", "Mon–Fri, 9am–5.30pm GMT"] },
                  { icon: MapPin,title: "Headquarters",     lines: ["Google Campus, 4–5 Bonhill St", "Shoreditch, London EC2A 4BX", "United Kingdom"] },
                  { icon: Clock, title: "Business Hours",   lines: ["Monday – Friday", "9:00 AM – 6:00 PM GMT"] },
                ].map(({ icon: Icon, title, lines }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#00FFB3]/10 border border-[#00FFB3]/15 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#00FFB3]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{title}</p>
                      {lines.map(l => <p key={l} className="text-xs text-white/45 leading-relaxed">{l}</p>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Help centre card */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm">
                <p className="text-sm font-bold text-white mb-1">Looking for Support?</p>
                <p className="text-xs text-white/40 mb-4 leading-relaxed">Check our Help Centre for quick answers to common questions.</p>
                <Link href="/help"
                  className="block w-full text-center h-10 leading-10 rounded-xl border border-white/[0.12] text-white/70 text-sm font-medium hover:bg-white/[0.06] hover:text-white transition-all">
                  Visit Help Centre
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold text-white text-center mb-8" style={{ letterSpacing: "-0.01em" }}>
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  q: "How quickly will I receive a response?",
                  a: "We aim to respond to all enquiries within 24 hours during business days. For urgent matters, please include \"URGENT\" in your subject line.",
                },
                {
                  q: "Do you offer phone support?",
                  a: "Phone support is available for Professional plan subscribers. Free and Starter plan users can reach us via email or the contact form.",
                },
                {
                  q: "Can I schedule a demo or consultation?",
                  a: "Yes! Please mention \"Demo Request\" in your subject line and include your preferred dates and times. We'll arrange a video call with our team.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                  <p className="text-sm font-bold text-[#00FFB3] mb-3">{q}</p>
                  <p className="text-sm text-white/45 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
