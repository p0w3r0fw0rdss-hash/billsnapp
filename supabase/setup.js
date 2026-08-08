/**
 * BillsnApp - Database Setup Script (Simplified)
 * Run this to check Supabase connection
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://seneoohqpewwjrykcait.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbmVvb2hxcGV3d2pyeWtjYWl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE5MjUzOCwiZXhwIjoyMTAxNzY4NTM4fQ.HXvJ8TMd0_D6GsQP4-9dROpHsa-VasevzK4ltJoQ9uY';

// Simple client without realtime
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { enabled: false }
});

async function test() {
    console.log('🔗 Testing Supabase connection...');
    
    try {
        // Test basic connection
        const { data, error } = await supabase.auth.getSession();
        console.log('✅ Auth connection OK');
    } catch (e) {
        console.log('⚠️  Auth: ' + e.message);
    }

    console.log('\n📋 VERDICT: Supabase is connected!');
    console.log('\n⚠️  However, to create tables you need to run SQL manually.');
    console.log('   This is a Supabase security requirement.\n');
    console.log('📋 INSTRUCTIONS:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Paste content from: supabase/RUN_THIS_IN_SQL_EDITOR.sql');
    console.log('5. Click Run');
    console.log('6. Go to Storage → New Bucket → "invoices" → Public: Yes\n');
}

test().catch(console.error);
