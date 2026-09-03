import { initializeApp, cert, getApps } from 'npm:firebase-admin/app';
import { getAuth } from 'npm:firebase-admin/auth';
import { getFirestore } from 'npm:firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert(
      JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!)
    ),
  });
}

const auth = getAuth();
const db = getFirestore();
db.settings({ preferRest: true });

const ONESIGNAL_APP_ID = '99029f45-35cb-484b-941f-fafa21c8fe2e';

const ACTION_WORDS = {
  feed: 'fed',
  walk: 'walked',
  play: 'played with',
  bath: 'bathed',
  groom: 'groomed',
  nail: 'trimmed nails for',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    // ---- 1. Verify the caller is who they say they are ----
    const authHeader = req.headers.get('Authorization') ?? '';
    const idToken = authHeader.replace('Bearer ', '');

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (err) {
      console.error('Token verification failed:', err);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const loggerUid = decoded.uid;

    // ---- 2. Parse body — but don't trust otherUids yet ----
    const body = await req.json();
    const { householdId, dogName, careType, loggerName } = body;

    if (
      typeof householdId !== 'string' ||
      typeof dogName !== 'string' ||
      dogName.length > 100 ||
      typeof careType !== 'string'
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ---- 3. Look up the household ourselves, don't trust the client's list ----
    const householdSnap = await db
      .collection('households')
      .doc(householdId)
      .get();

    if (!householdSnap.exists) {
      return new Response(JSON.stringify({ error: 'Household not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const memberUids: string[] = householdSnap.data()?.memberUids ?? [];

    // Caller must actually belong to this household.
    if (!memberUids.includes(loggerUid)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const otherUids = memberUids.filter((uid) => uid !== loggerUid);

    if (otherUids.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- 4. Send the push, same as before ----
    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!restApiKey) {
      console.error('ONESIGNAL_REST_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const actionWord = ACTION_WORDS[careType] || 'cared for';
    const safeLoggerName =
      typeof loggerName === 'string' && loggerName.length <= 60
        ? loggerName
        : 'Someone';

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: otherUids },
        target_channel: 'push',
        headings: { en: `${dogName} update 🐾` },
        contents: { en: `${safeLoggerName} just ${actionWord} ${dogName}.` },
      }),
    });

    const result = await response.json();
    console.log('OneSignal response:', result);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'OneSignal request failed', details: result }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-other-members error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});