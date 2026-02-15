import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { age_months } = await req.json();
    const babyName = user.baby_name || 'Baby';

    const browserbaseApiKey = Deno.env.get('BROWSERBASE_API_KEY');
    if (!browserbaseApiKey) {
      return Response.json({ error: 'Browserbase API key not configured' }, { status: 500 });
    }

    // Create a Browserbase session for scraping clinical data
    const sessionRes = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${browserbaseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        browser_settings: {
          viewport: {
            width: 1024,
            height: 768,
          },
        },
      }),
    });

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.id;

    // Scrape WHO/CDC clinical data
    const browseRes = await fetch('https://api.browserbase.com/v1/sessions/' + sessionId + '/browse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${browserbaseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.cdc.gov/growthcharts/html_charts/lengthweight.htm`,
      }),
    });

    const browseData = await browseRes.json();
    const htmlContent = browseData.markdown || browseData.html;

    // Use LLM to extract relevant statistics from the scraped content
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract clinical statistics for a ${age_months}-month-old baby from this CDC growth chart documentation:

${htmlContent}

Provide:
1. Average weight (in lbs and kg)
2. Average length/height (in inches and cm)
3. Normal range for weight
4. Normal range for length
5. Head circumference if available
6. Developmental milestones for this age
7. Feeding guidelines (how many oz per day, feeding frequency)
8. Sleep requirements (hours per day)

Format as structured data that can be compared to individual baby stats.`,
      response_json_schema: {
        type: 'object',
        properties: {
          age_months: { type: 'number' },
          weight_lbs: { type: 'string' },
          weight_kg: { type: 'string' },
          weight_range: { type: 'string' },
          length_inches: { type: 'string' },
          length_cm: { type: 'string' },
          length_range: { type: 'string' },
          head_circumference: { type: 'string' },
          developmental_milestones: { type: 'array', items: { type: 'string' } },
          feeding_oz_per_day: { type: 'string' },
          feeding_frequency: { type: 'string' },
          sleep_hours: { type: 'string' },
          source: { type: 'string' },
        },
      },
    });

    // If CDC data insufficient, scrape AAP (American Academy of Pediatrics)
    if (!analysisResult.weight_lbs) {
      const aapRes = await fetch('https://api.browserbase.com/v1/sessions/' + sessionId + '/browse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${browserbaseApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.healthychildren.org/English/ages-stages/baby/Pages/default.aspx`,
        }),
      });

      const aapData = await aapRes.json();
      const aapHtml = aapData.markdown || aapData.html;

      const aapAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract clinical statistics for a ${age_months}-month-old baby from this AAP resource:

${aapHtml}

Provide the same structured data about weight, length, feeding, sleep, and development.`,
        response_json_schema: analysisResult.schema,
      });

      return Response.json({
        success: true,
        statistics: { ...analysisResult, ...aapAnalysis },
        source: 'American Academy of Pediatrics (AAP)',
      });
    }

    // Close the session
    await fetch('https://api.browserbase.com/v1/sessions/' + sessionId, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${browserbaseApiKey}`,
      },
    });

    return Response.json({
      success: true,
      statistics: analysisResult,
      source: 'CDC Growth Charts & Clinical Data',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});