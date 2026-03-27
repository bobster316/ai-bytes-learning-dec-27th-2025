
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SpacedRepetitionService } from "@/lib/services/spaced-repetition";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const srService = new SpacedRepetitionService();
        const cards = await srService.getDueCards(user.id, 20);

        return NextResponse.json({ cards });
    } catch (error: any) {
        console.error("[API] Failed to fetch due cards:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
