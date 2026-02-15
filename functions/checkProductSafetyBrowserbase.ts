import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url } = await req.json();

    if (!image_url) {
      return Response.json({ error: 'image_url required' }, { status: 400 });
    }

    const browserbaseApiKey = Deno.env.get('BROWSERBASE_API_KEY');
    if (!browserbaseApiKey) {
      return Response.json({ error: 'Browserbase API key not configured' }, { status: 500 });
    }

    // Step 1: Identify the product from the image with detailed info
    const productIdentification = await base44.integrations.Core.InvokeLLM({
      prompt: `Identify the product from this image with maximum accuracy. Extract:
1. Exact product name (as written on label)
2. Brand name (as written on label)
3. Category (skincare, cleaning, cosmetics, personal care, hair care, etc.)
4. Product type (lotion, cleanser, shampoo, etc.)
5. Any variant info (SPF, scent, etc.)`,
      response_json_schema: {
        type: 'object',
        properties: {
          product_name: { type: 'string' },
          brand: { type: 'string' },
          category: { type: 'string' },
          product_type: { type: 'string' },
          variant: { type: 'string' },
        },
      },
      file_urls: [image_url],
    });

    const { product_name, brand, category, product_type } = productIdentification;

    // Step 2: Use Browserbase to scrape EWG database
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

    // Search EWG database for the product
    const ewgSearchUrl = `https://www.ewg.org/skindeep/search?search=${encodeURIComponent(brand + ' ' + product_name)}`;

    const ewgSearchRes = await fetch('https://api.browserbase.com/v1/sessions/' + sessionId + '/browse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${browserbaseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: ewgSearchUrl,
      }),
    });

    const ewgSearchData = await ewgSearchRes.json();
    const ewgSearchContent = ewgSearchData.markdown || ewgSearchData.html;

    // Extract the product URL from search results
    const urlMatch = await base44.integrations.Core.InvokeLLM({
      prompt: `Find the direct product page URL from these EWG search results for "${brand} ${product_name}". 
Look for the first product result that matches the brand and product name.
Extract the full product page URL (it should contain /skindeep/products/ and a number).
Return ONLY the complete URL starting with https://, nothing else.

Search results:
${ewgSearchContent}`,
    });

    let ewgProductUrl = urlMatch.trim();
    
    // If we got a URL, fetch it to get the actual product data
    let ewgContent = '';
    if (ewgProductUrl.includes('/skindeep/products/')) {
      const productRes = await fetch('https://api.browserbase.com/v1/sessions/' + sessionId + '/browse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${browserbaseApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: ewgProductUrl,
        }),
      });
      
      const productData = await productRes.json();
      ewgContent = productData.markdown || productData.html;
    } else {
      // Fallback to search results if URL extraction failed
      ewgContent = ewgSearchContent;
      ewgProductUrl = ewgSearchUrl;
    }

    // Extract rating and safety information from EWG results
    const ewgAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract the EWG safety rating for this product from the EWG database results:

${ewgContent}

Product being searched: ${brand} ${product_name}

Return:
1. EWG Hazard Score (0-10, where 0 is safest)
2. Product rating/category (Green/Yellow/Red)
3. Key concerns/ingredients of concern
4. Overall safety summary (1-2 sentences)`,
      response_json_schema: {
        type: 'object',
        properties: {
          hazard_score: { type: 'number' },
          rating: { type: 'string' },
          concerns: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    });

    // Close session
    await fetch('https://api.browserbase.com/v1/sessions/' + sessionId, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${browserbaseApiKey}`,
      },
    });

    // Map hazard score to safety level
    const getSafetyLevel = (score) => {
      if (score <= 2) return { level: 'Safe', color: 'green' };
      if (score <= 5) return { level: 'Caution', color: 'yellow' };
      return { level: 'Avoid', color: 'red' };
    };

    const safetyLevel = getSafetyLevel(ewgAnalysis.hazard_score);

    return Response.json({
      success: true,
      product: {
        name: product_name,
        brand: brand,
        category: category,
        type: product_type,
      },
      safety: {
        hazard_score: ewgAnalysis.hazard_score,
        rating: ewgAnalysis.rating,
        level: safetyLevel.level,
        color: safetyLevel.color,
        concerns: ewgAnalysis.concerns || [],
        summary: ewgAnalysis.summary,
      },
      source: 'EWG SkinDeep Database',
      ewg_url: ewgProductUrl,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});