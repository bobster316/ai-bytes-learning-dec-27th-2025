"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "unlimited";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plans = {
    unlimited: {
      name: "Unlimited",
      price: 49,
      billing: "month",
      features: [
        "Unlimited courses (Beginner & Intermediate)",
        "New courses added monthly",
        "Download for offline viewing",
        "All certificates",
        "Priority support (24-hour response)",
        "Advanced AI study companion",
      ],
    },
    professional: {
      name: "Professional",
      price: 99,
      billing: "month",
      features: [
        "Everything in Unlimited",
        "Unlimited Advanced courses",
        "1-on-1 monthly Q&A session (30 min)",
        "Private community access",
        "Premium AI companion (unlimited)",
        "Priority support (4-hour response)",
        "Career guidance resources",
      ],
    },
    course: {
      name: "Single Course",
      price: 39,
      billing: "one-time",
      features: [
        "Lifetime access to purchased course",
        "All course materials and updates",
        "Certificate upon completion",
        "Own forever, no subscription",
      ],
    },
  };

  const selectedPlan = plans[plan as keyof typeof plans] || plans.unlimited;

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      // TODO: Integrate Stripe checkout
      // const response = await fetch("/api/create-checkout-session", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ plan }),
      // });
      // const { sessionId } = await response.json();
      // const stripe = await getStripe();
      // await stripe.redirectToCheckout({ sessionId });

      // Temporary simulation
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#1E3A5F] to-[#0F172A]">
      <Header />

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="bg-[#00BFA5]/20 text-[#00BFA5] border border-[#00BFA5]/30 mb-4">
              <Lock className="w-4 h-4 mr-1" />
              Secure Checkout
            </Badge>
            <h1 className="text-4xl font-bold">Complete Your Purchase</h1>
            <p className="text-white/60 mt-2">
              You're one step away from starting your AI learning journey
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Plan</span>
                      <span className="font-semibold">{selectedPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Billing</span>
                      <span className="capitalize">{selectedPlan.billing}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <h4 className="font-semibold text-sm">Features included:</h4>
                    <ul className="space-y-2">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <span className="text-white/70">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#00BFA5]">
                        £{selectedPlan.price}
                        {selectedPlan.billing !== "one-time" && (
                          <span className="text-sm font-normal text-white/60">
                            /{selectedPlan.billing}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-3 flex items-center gap-2 mb-6">
                      <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                      <p className="text-sm text-[#EF4444]">{error}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-lg p-4">
                      <p className="text-sm text-white/80">
                        This is a demo checkout page. In production, Stripe Elements
                        would be integrated here for secure payment processing.
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={loading}
                    >
                      {loading ? (
                        "Processing..."
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Pay £{selectedPlan.price}
                        </>
                      )}
                    </Button>

                    <div className="text-center space-y-2">
                      <p className="text-xs text-white/60">
                        By completing your purchase, you agree to our{" "}
                        <a href="/terms" className="text-[#00BFA5] hover:underline">
                          Terms of Service
                        </a>
                      </p>
                      <div className="flex items-center justify-center gap-4 text-xs text-white/40">
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Secure payment</span>
                        </div>
                        <span>•</span>
                        <span>Powered by Stripe</span>
                        <span>•</span>
                        <span>30-day guarantee</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
