"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseTemplate } from "@/lib/types/schema";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming we have or will create this
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseEditorProps {
    template: CourseTemplate & { topics: any[] }; // simplified type
}

export function CourseEditor({ template }: CourseEditorProps) {
    const router = useRouter();
    const [isPublishing, setIsPublishing] = useState(false);
    const [formData, setFormData] = useState({
        title: template.title,
        description: template.description,
    });

    const handlePublish = async () => {
        if (!confirm("Are you sure you want to publish this course? It will become visible to the public.")) return;

        setIsPublishing(true);
        try {
            const res = await fetch('/api/admin/publish-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: template.id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert("Course Published Successfully!");
            router.push('/courses'); // Go to public catalog
        } catch (error: any) {
            alert("Failed to publish: " + error.message);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="flex gap-2">
                    {template.is_locked && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Locked (Published)</Badge>
                    )}
                    <Button disabled={template.is_locked || isPublishing} onClick={handlePublish} className="bg-green-600 hover:bg-green-700 text-white">
                        {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                        Publish Course
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Course Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Course Title</label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                disabled={template.is_locked}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                disabled={template.is_locked}
                                rows={5}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Topics Preview (Read only for now as per instructions "Edit title & description") */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Topics ({template.topics?.length || 0})</h3>
                    {template.topics?.map((topic: any, i: number) => (
                        <Card key={topic.id || i}>
                            <CardHeader>
                                <CardTitle className="text-lg">{topic.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topic.lessons?.map((lesson: any, j: number) => (
                                        <div key={lesson.id || j} className="p-3 bg-muted rounded-md flex justify-between items-center group">
                                            <div>
                                                <p className="font-medium text-sm">{lesson.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {lesson.content_markdown ? "Content Generated" : "No Content"} ({lesson.estimated_duration_minutes} min)
                                                </p>
                                            </div>
                                            {/* Preview Button (Placeholder for now) */}
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                                Preview
                                            </Button>
                                        </div>
                                    ))}
                                    {(!topic.lessons || topic.lessons.length === 0) && (
                                        <p className="text-sm text-muted-foreground italic">No lessons in this topic.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
