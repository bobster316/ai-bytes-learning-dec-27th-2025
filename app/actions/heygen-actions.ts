"use server";

import { heyGenService } from "@/lib/services/heygen-service";

/**
 * Fetch current HeyGen credit balance and GBP estimation
 */
export async function getHeyGenCredits() {
    try {
        const credits = await heyGenService.checkCredits();
        return {
            success: true,
            credits
        };
    } catch (error: any) {
        console.error("Failed to fetch HeyGen credits in action:", error);
        return {
            success: false,
            error: error.message || "Failed to fetch credit balance"
        };
    }
}
