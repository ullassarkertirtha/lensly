const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^["']|["']$/g, '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^["']|["']$/g, '').trim()

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase