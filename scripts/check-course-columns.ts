
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'courses' })
    if (error) {
        // If RPC doesn't exist, try a simple select
        console.log("RPC failed, trying simple select...")
        const { data: selectData, error: selectError } = await supabase.from('courses').select('*').limit(1)
        if (selectError) {
            console.error("Select error:", selectError)
            return
        }
        if (selectData && selectData.length > 0) {
            console.log("Columns in 'courses':", Object.keys(selectData[0]))
        } else {
            console.log("No data in 'courses' to inspect columns.")
        }
    } else {
        console.log("Table info:", data)
    }
}

checkColumns()
