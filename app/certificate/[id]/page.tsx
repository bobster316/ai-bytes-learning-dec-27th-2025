"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";

export default function CertificatePage({ params }: { params: { id: string } }) {
  // Mock certificate data
  const certificate = {
    id: params.id,
    courseName: "Your Smartphone's Secret: How AI Lives in Your Pocket",
    studentName: "John Smith",
    completionDate: "15 January 2025",
    issueDate: "16 January 2025",
    certificateNumber: "AIBL-2025-001247",
    instructor: "Dr. Sarah Johnson",
    score: 92,
    verified: true,
  };

  const handleDownload = () => {
    // TODO: Generate PDF certificate
    console.log("Downloading certificate...");
  };

  const handleShare = () => {
    // TODO: Share to LinkedIn, Twitter, etc.
    console.log("Sharing certificate...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#1E3A5F] to-[#0F172A]">
      <Header />

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12 space-y-4">
            <Badge className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Verified Certificate
            </Badge>
            <h1 className="text-4xl font-bold">Certificate of Completion</h1>
            <p className="text-white/60">
              Congratulations on completing the course!
            </p>
          </div>

          {/* Certificate Preview */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-12 lg:p-16 border-8 border-[#00BFA5]/20">
              <div className="text-center space-y-8">
                {/* Logo/Badge */}
                <div className="w-24 h-24 bg-gradient-to-br from-[#00BFA5] to-[#2563EB] rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-12 h-12 text-white" />
                </div>

                {/* Header */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">AI Bytes Learning</h2>
                  <p className="text-xl text-white/60">Certificate of Completion</p>
                </div>

                {/* Body */}
                <div className="space-y-6 py-8">
                  <p className="text-white/80">This certifies that</p>
                  <h3 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00BFA5] to-[#2563EB]">
                    {certificate.studentName}
                  </h3>
                  <p className="text-white/80">has successfully completed</p>
                  <h4 className="text-2xl font-semibold max-w-2xl mx-auto">
                    {certificate.courseName}
                  </h4>
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Completion Date</p>
                    <p className="font-semibold">{certificate.completionDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60 mb-1">Score Achieved</p>
                    <p className="font-semibold text-[#10B981]">{certificate.score}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60 mb-1">Certificate ID</p>
                    <p className="font-semibold text-sm">{certificate.certificateNumber}</p>
                  </div>
                </div>

                {/* Signature */}
                <div className="pt-8 border-t border-white/10">
                  <div className="max-w-xs mx-auto">
                    <div className="border-b border-white/40 pb-2 mb-2">
                      <p className="font-script text-2xl">{certificate.instructor}</p>
                    </div>
                    <p className="text-sm text-white/60">Course Instructor</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button className="flex-1" size="lg" onClick={handleDownload}>
              <Download className="w-5 h-5 mr-2" />
              Download Certificate
            </Button>
            <Button variant="outline" className="flex-1" size="lg" onClick={handleShare}>
              <Share2 className="w-5 h-5 mr-2" />
              Share on LinkedIn
            </Button>
          </div>

          {/* Certificate Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  Verification Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Status</span>
                    <Badge variant="beginner">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Issue Date</span>
                    <span>{certificate.issueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Certificate ID</span>
                    <span className="font-mono text-xs">
                      {certificate.certificateNumber}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <a
                      href={`/verify/${certificate.id}`}
                      className="text-[#00BFA5] hover:underline text-sm"
                    >
                      Verify this certificate →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#00BFA5]" />
                  Achievement Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span className="text-white/60">
                      Completed on {certificate.completionDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-white/40" />
                    <span className="text-white/60">
                      Taught by {certificate.instructor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-white/40" />
                    <span className="text-white/60">
                      Final score: {certificate.score}%
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-white/60">
                      Skills validated: AI Fundamentals, Smartphone Technology,
                      Mobile AI Applications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
