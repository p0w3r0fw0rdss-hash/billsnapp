const https = require('https');

const SUPABASE_URL = 'https://seneoohqpewwjrykcait.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbmVvb2hxcGV3d2pyeWtjYWl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE5MjUzOCwiZXhwIjoyMTAxNzY4NTM4fQ.HXvJ8TMd0_D6GsQP4-9dROpHsa-VasevzK4ltJoQ9uY';

async function fetchJSON(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(SUPABASE_URL + path);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function test() {
    console.log('🔍 Verificando conexión con Supabase...\n');
    
    // Test auth
    try {
        const { status } = await fetchJSON('/auth/v1/health');
        console.log(`✅ Auth: ${status === 200 ? 'OK' : 'Error ' + status}`);
    } catch (e) {
        console.log(`❌ Auth: ${e.message}`);
    }

    // Test REST API (tables)
    const tables = ['companies', 'clients', 'invoices', 'emitted_invoices', 'subscriptions', 'credits', 'settings'];
    
    for (const table of tables) {
        try {
            const { status, data } = await fetchJSON(`/rest/v1/${table}?select=*&limit=1`);
            if (status === 200) {
                console.log(`✅ Tabla '${table}': OK`);
            } else if (status === 404) {
                console.log(`❌ Tabla '${table}': No existe (ejecuta el SQL)`);
            } else {
                console.log(`⚠️  Tabla '${table}': Status ${status}`);
            }
        } catch (e) {
            console.log(`❌ Tabla '${table}': ${e.message}`);
        }
    }

    // Test storage
    try {
        const { status, data } = await fetchJSON('/storage/v1/bucket');
        if (status === 200 && Array.isArray(data)) {
            const invoicesBucket = data.find(b => b.name === 'invoices');
            console.log(invoicesBucket ? 
                `✅ Storage 'invoices': OK` : 
                `⚠️  Storage 'invoices': No encontrado`
            );
        } else {
            console.log(`⚠️  Storage: Status ${status}`);
        }
    } catch (e) {
        console.log(`❌ Storage: ${e.message}`);
    }

    console.log('\n🎉 Verificación completada!');
}

test().catch(console.error);
