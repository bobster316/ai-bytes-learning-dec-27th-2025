
import { createClient } from "@/lib/supabase/server";
import { CertificateRenderer } from "@/components/course/certificate-renderer";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CertificatePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  // Fetch Certificate details
  const { data: cert, error } = await supabase
    .from('certificates')
    .select(`
          *,
          course:courses (
              title
          )
      `)
    .eq('id', params.id)
    .single();

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Certificate Not Found</h1>
          <p className="text-slate-400">The certificate you are looking for does not exist or has been removed.</p>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Map DB data to props
  const certificateProps = {
    studentName: cert.metadata?.studentName || "Student Name",
    courseTitle: cert.course?.title || cert.metadata?.courseTitle || "Course Title",
    completionDate: new Date(cert.completion_date).toLocaleDateString("en-GB", {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    certificateId: cert.certificate_number || cert.id,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        <CertificateRenderer {...certificateProps} />
      </div>
    </div>
  );
}
