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
            return Response.json({ error: 'image_url is required' }, { status: 400 });
        }

        // Step 1: Identify the product from the image
        const identificationResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this product image and identify:
1. The exact product name
2. The brand name
3. The product category (e.g., baby lotion, diaper cream, shampoo, etc.)

Return ONLY the product name, brand, and category. Be specific and accurate.`,
            file_urls: [image_url],
            response_json_schema: {
                type: "object",
                properties: {
                    product_name: { type: "string" },
                    brand: { type: "string" },
                    category: { type: "string" }
                },
                required: ["product_name"]
            }
        });

        const { product_name, brand, category } = identificationResult;

        // Step 2: Search EWG database for the product
        const ewgResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Search the EWG (Environmental Working Group) website for the EXACT product: "${product_name}" by "${brand}".

CRITICAL: You must find information about THIS SPECIFIC product - "${product_name}" by "${brand}". Do not return information about different products.

Extract:
1. The EWG safety rating (1-10 scale, where 1-2 is best, 3-6 is moderate concern, 7-10 is highest concern)
2. Key ingredients of concern for THIS specific product
3. A brief summary of why this rating was given
4. The exact EWG product page URL for "${product_name}" by "${brand}"

IMPORTANT: 
- The URL must be for "${product_name}" by "${brand}", not a different product
- If you cannot find this exact product on EWG, set ewg_url to null
- Verify the URL contains the correct product name before returning it`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    rating: { 
                        type: "number",
                        description: "EWG rating from 1-10"
                    },
                    concerns: {
                        type: "array",
                        items: { type: "string" },
                        description: "List of key ingredient concerns"
                    },
                    summary: {
                        type: "string",
                        description: "Brief explanation of the rating"
                    },
                    ewg_url: {
                        type: "string",
                        description: "URL to the EWG product page for this exact product, or null if not found"
                    }
                }
            }
        });

        return Response.json({
            product_name,
            brand: brand || null,
            category: category || null,
            rating: ewgResult.rating || null,
            concerns: ewgResult.concerns || [],
            summary: ewgResult.summary || null,
            ewg_url: ewgResult.ewg_url || null
        });

    } catch (error) {
        console.error('Error checking product safety:', error);
        return Response.json({ 
            error: 'Failed to check product safety',
            details: error.message 
        }, { status: 500 });
    }
});