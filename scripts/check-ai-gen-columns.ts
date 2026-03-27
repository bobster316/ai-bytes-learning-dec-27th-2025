
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkColumns() {
    const { data: selectData, error: selectError } = await supabase.from('ai_generated_courses').select('*').limit(1)
    if (selectError) {
        console.error("Select error:", selectError)
        return
    }
    if (selectData && selectData.length > 0) {
        console.log("Columns in 'ai_generated_courses':", Object.keys(selectData[0]))
    } else {
        console.log("No data in 'ai_generated_courses' to inspect columns.")
    }
}

checkColumns()
