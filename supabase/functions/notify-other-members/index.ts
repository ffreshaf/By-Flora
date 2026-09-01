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
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const body = await req.json();

    const {
      otherUids,
      loggerName,
      dogName,
      careType,
    } = body;

    if (
      !Array.isArray(otherUids) ||
      otherUids.length === 0 ||
      !dogName ||
      !careType
    ) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const restApiKey =
      Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!restApiKey) {
      console.error(
        'ONESIGNAL_REST_API_KEY is not configured'
      );

      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const actionWord =
      ACTION_WORDS[careType] || 'cared for';

    const response = await fetch(
      'https://onesignal.com/api/v1/notifications',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${restApiKey}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_aliases: {
            external_id: otherUids,
          },
          target_channel: 'push',
          headings: {
            en: `${dogName} update 🐾`,
          },
          contents: {
            en: `${
              loggerName || 'Someone'
            } just ${actionWord} ${dogName}.`,
          },
        }),
      }
    );

    const result = await response.json();

    console.log('OneSignal response:', result);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'OneSignal request failed',
          details: result,
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error(
      'notify-other-members error:',
      error
    );

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
