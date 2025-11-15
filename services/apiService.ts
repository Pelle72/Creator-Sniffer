import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { SearchResult, SearchType, ImagePayload, GroundingChunk, ApiProvider } from '../types';

interface FindContentParams {
  provider: ApiProvider;
  query: string;
  searchType: SearchType;
  favoritedUris?: string[];
  signal: AbortSignal;
  image?: ImagePayload | null;
  useWildcard?: boolean;
  searchForEmails?: boolean;
  geminiApiKey?: string;
  xaiApiKey?: string;
  isGrokAgeVerified?: boolean;
}

interface ApiResponse {
  summary: string;
  aliases: string[];
  results: SearchResult[];
  communityLinks: SearchResult[];
}

const parseJsonResponse = (text: string): Omit<ApiResponse, 'communityLinks'> | null => {
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonBlockRegex);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      
      // Basic validation
      if (typeof parsed.summary !== 'string') parsed.summary = "The AI returned an invalid summary.";
      if (!Array.isArray(parsed.aliases)) parsed.aliases = [];
      if (!Array.isArray(parsed.results)) parsed.results = [];

      parsed.results = parsed.results.filter((res: any) => res && typeof res.uri === 'string' && (res.uri.startsWith('http') || res.uri.startsWith('mailto:')));
      
      return parsed;

    } catch (e) {
      console.error("Failed to parse JSON from AI response", e);
      return null;
    }
  }
  return null;
}

/**
 * Generates permutations for a given username, handling common separators.
 * Handles comma-separated lists of usernames.
 */
const generateUsernamePermutations = (query: string): string[] => {
  const usernames = query.split(/, ?/).map(q => q.trim()).filter(Boolean);
  const permutationSet = new Set<string>();

  for (const username of usernames) {
    // Add the original username
    permutationSet.add(username);

    // Generate permutations only if a separator exists
    if (/[._-]/.test(username)) {
      const baseName = username.replace(/[._-]/g, '');
      permutationSet.add(baseName); // e.g., shadowsisa
      permutationSet.add(username.replace(/[._-]/g, '_')); // e.g., shadows_isa
      permutationSet.add(username.replace(/[._-]/g, '-')); // e.g., shadows-isa
      permutationSet.add(username.replace(/[._-]/g, '.')); // e.g., shadows.isa
    }
  }

  return Array.from(permutationSet);
};


// --- Gemini Specific Logic ---

const createGeminiTextPrompt = (query: string, searchType: SearchType, favoritedUris: string[], useWildcard: boolean, searchForEmails: boolean, permutations: string[]): string => {
  const searchTarget = searchType === 'work'
    ? `The user is searching for a creative work titled '${query}'. Your first step is to identify the original creator of that work, then use their name(s) for the investigation.`
    : `The user is searching for a creator with the name or alias '${query}'.`;
  
  const permutationsList = permutations.map(p => `- \`${p}\``).join('\n');
  const platformList = [
      'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'picsart.com', 'threads.net', 
      'deviantart.com', 'artstation.com', 'patreon.com', 'reddit.com', 'tumblr.com', 
      'behance.net', 'linktr.ee', 'ko-fi.com', 'fansly.com', 'onlyfans.com', 'youtube.com',
      'facebook.com', 'pinterest.com'
  ].map(p => `- ${p}`).join('\n');

  let emailSearchInstructions = '';
  if (searchForEmails) {
    emailSearchInstructions = `
*   **Email Search:** You must also search for any publicly listed email addresses associated with the creator. Look for them in profile bios, "about" pages, and contact sections.`;
    if (useWildcard) {
      const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'protonmail.com'];
      const emailPermutations = permutations.flatMap(p => emailDomains.map(d => `${p}@${d}`));
      const emailPermutationsList = emailPermutations.map(p => `- \`${p}\``).join('\n');
      emailSearchInstructions += ` As part of this, you MUST also actively search for the following potential email addresses:
${emailPermutationsList}`;
    }
  }

  return `You are a world-class Digital Content Investigator.

**INVESTIGATION BRIEF:**

*   **Objective:** Find all public online profiles, content, and aliases for a creator.
*   **Search Target:** ${searchTarget}
*   **Known Usernames/Aliases:** Your primary investigation must focus on this definitive list of known and potential usernames:
    ${permutationsList}
*   **Key Platforms to Investigate:** Prioritize your search on these platforms, but do not limit yourself if you find strong leads elsewhere:
    ${platformList}
${emailSearchInstructions}

**REPORTING INSTRUCTIONS:**
Compile all your findings into a comprehensive summary. Your final response MUST end with a single, clean JSON object in a markdown code block. Do not include any text after the JSON block.
- \`summary\`: Your detailed text summary of the investigation, including your search process and findings.
- \`aliases\`: An array of ALL new aliases you discovered.
- \`results\`: An array of direct links to profiles, content, and any found email addresses (formatted as "mailto:email@example.com").
`;
};

const createGeminiImagePrompt = (query: string, permutations: string[]): string => {
    const textHint = query ? `The user has provided a text hint: '${query}'. Use this to guide your investigation.` : `The user has not provided any text hint. Your analysis must be based solely on the provided image.`;
    const permutationsList = permutations.map(p => `- \`${p}\``).join('\n');
    const platformList = [
      'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'picsart.com', 'threads.net', 
      'deviantart.com', 'artstation.com', 'patreon.com', 'reddit.com', 'tumblr.com'
    ].map(p => `- ${p}`).join('\n');

    return `You are a world-class Digital Art Investigator.

**INVESTIGATION BRIEF:**
  
*   **Mission:** Analyze the provided image to identify the original creator and then find their complete online presence.
*   **Image Analysis:** Perform deep analysis of the image. Use OCR to extract ALL visible text (usernames are critical clues) and use reverse image search to find where it's posted.
*   **User Hint:** ${textHint}
*   **Initial Aliases:** Based on your analysis and the user hint, you will investigate all permutations of found names. The initial list to investigate is:
    ${permutationsList}
*   **Key Platforms:** For EACH potential username, investigate their presence on these sites:
    ${platformList}

**REPORTING INSTRUCTIONS:**
After completing your investigation, compile all discovered profile links and aliases. Your response must end with a single, clean JSON object in a markdown code block.
- If you cannot identify a creator, the summary must state this, and 'aliases' and 'results' MUST be empty arrays.
`;
};


async function callGeminiApi(params: FindContentParams): Promise<ApiResponse> {
    if (!params.geminiApiKey) throw new Error("Gemini API key is not configured.");

    const ai = new GoogleGenAI({ apiKey: params.geminiApiKey });
    
    const permutations = generateUsernamePermutations(params.query);
    let contents: any;
    
    if (params.image) {
      const prompt = createGeminiImagePrompt(params.query, permutations);
      contents = { parts: [{ inlineData: { mimeType: params.image.mimeType, data: params.image.data } }, { text: prompt }] };
    } else {
      const prompt = createGeminiTextPrompt(params.query, params.searchType, params.favoritedUris || [], params.useWildcard || false, params.searchForEmails || false, permutations);
      contents = prompt;
    }

    const safetySettings = Object.values(HarmCategory).map(category => ({
        category,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    }));
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
      safetySettings,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
      requestOptions: { signal: params.signal },
    });

    const parsedData = parseJsonResponse(response.text);
    if (!parsedData) {
        throw new Error("The AI returned a response in an unexpected format.");
    }
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const communityLinks: SearchResult[] = groundingChunks
        .map(chunk => chunk.web)
        .filter((web): web is { uri: string; title: string } => !!web && !!web.uri && !!web.title)
        .map(web => ({ uri: web.uri, title: web.title }));
      
    const resultUris = new Set(parsedData.results.map(r => r.uri));
    const uniqueCommunityLinks = communityLinks.filter(link => !resultUris.has(link.uri));

    return { ...parsedData, communityLinks: uniqueCommunityLinks };
}


// --- Grok (xAI) Specific Logic ---

const createXaiImagePrompt = (query: string, permutations: string[]): string => {
    const textHint = query ? `The user has provided a text hint along with the image: '${query}'.` : `The user has not provided any text hint.`;
    const permutationsList = permutations.map(p => `- \`${p}\``).join('\n');
    const platformList = [
      'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'picsart.com', 'threads.net', 
      'deviantart.com', 'artstation.com', 'patreon.com', 'reddit.com', 'tumblr.com'
    ].map(p => `- ${p}`).join('\n');

    return `You are Grok, a Digital Art Investigator.

**INVESTIGATION BRIEF:**

*   **Mission:** Identify the creator in the image and find their online presence.
*   **Image Analysis:** Perform OCR on the image to extract ALL text. Use reverse image search to find where it's posted.
*   **User Hint:** ${textHint}
*   **Initial Aliases:** Based on your analysis, investigate all permutations of found names. Your initial list to investigate is:
    ${permutationsList}
*   **Key Platforms:** For EACH potential username, investigate their presence on these sites:
    ${platformList}
  
**REPORTING INSTRUCTIONS (Strict & Mandatory JSON Mode):**
Your entire response MUST be a single, valid JSON object. Do NOT output any other text, explanation, or markdown formatting. The JSON object must conform to this structure:
    {
      "summary": "Your text summary of the investigation. If no creator is found, state it here.",
      "aliases": [],
      "results": [],
      "communityLinks": []
    }
  `;
};

const createXaiPrompt = (query: string, searchType: SearchType, favoritedUris: string[], useWildcard: boolean, searchForEmails: boolean, isGrokAgeVerified: boolean, permutations: string[]): string => {
    const searchTarget = searchType === 'work'
        ? `The user is searching for a creative work titled '${query}'. Your first step is to identify the original creator.`
        : `The user is searching for a creator with the name or alias '${query}'.`;
    
    const adultSearchDirective = isGrokAgeVerified ? `*   **PRIORITY DIRECTIVE: Adult Content Investigation:** Since the user has verified their age, you MUST prioritize a thorough investigation of adult content platforms. This is a primary objective.` : '';

    const adultPlatforms = isGrokAgeVerified ? `
     - **Monetization & Premium Content**: OnlyFans, Fansly, Patreon (check for adult content), Gumroad (check for adult content), SubscribeStar, Fanvue, Loyalfans, MYM.fans, iFans, ManyVids, Chaturbate, MyFreeCams.
     - **Video Platforms**: Pornhub, XVideos, XHamster, SpankBang.
     - **Community Hubs & Forums**: Reddit (NSFW subreddits), Kemono.party, coomer.party, yiff.party, F-list.net.
     - **Imageboards & Boorus**: e-hentai.org, sankakucomplex.com, danbooru.donmai.us, gelbooru.com, rule34.xxx, e621.net, derpibooru.org.` : '';
    
    const permutationsList = permutations.map(p => `- \`${p}\``).join('\n');

    let emailSearchInstructions = '';
    if (searchForEmails) {
        emailSearchInstructions = `
*   **Email Search:** You must also search for any publicly listed email addresses.`;
        if (useWildcard) {
            const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'protonmail.com'];
            const emailPermutations = permutations.flatMap(p => emailDomains.map(d => `${p}@${d}`));
            const emailPermutationsList = emailPermutations.map(p => `- \`${p}\``).join('\n');
            emailSearchInstructions += ` As part of this, actively search for these potential emails:
${emailPermutationsList}`;
        }
    }

    return `You are Grok, a Digital Content Investigator.

**INVESTIGATION BRIEF:**

*   **Objective:** Conduct a comprehensive web search to find all public online profiles, content, and aliases for a creator.
*   **Search Target:** ${searchTarget}
${adultSearchDirective}
*   **Known Usernames/Aliases:** Your primary investigation must use this definitive list of usernames:
    ${permutationsList}
*   **Key Platforms to Investigate:**
     - **Primary**: Instagram, TikTok, X.com/Twitter, Picsart, Threads.net, DeviantArt, ArtStation
     - **Secondary**: Reddit, Tumblr, Facebook, Pinterest, Behance, Pixiv, Imgur, Fur Affinity
     - **Monetization**: Patreon, Ko-fi, Gumroad, Substack, Medium, Dribbble${adultPlatforms}
${emailSearchInstructions}

**REPORTING INSTRUCTIONS (Strict & Mandatory JSON Mode):**
Your entire response MUST be a single, valid JSON object. Do NOT output any other text or explanation.
{
  "summary": "Your text summary of the investigation.",
  "aliases": ["list", "of", "aliases"],
  "results": [
    {
      "uri": "https://... or mailto:...",
      "title": "Title of the content or Email Address",
      "thumbnailUrl": "https://... direct image link (optional)"
    }
  ],
  "communityLinks": [
     {
      "uri": "https://... link to a discussion",
      "title": "Title of the discussion"
    }
  ]
}
`;
}


async function callXaiApi(params: FindContentParams): Promise<ApiResponse> {
    if (!params.xaiApiKey) throw new Error("xAI API key is not configured.");
    
    const permutations = generateUsernamePermutations(params.query);

    const prompt = params.image 
        ? createXaiImagePrompt(params.query, permutations)
        : createXaiPrompt(params.query, params.searchType, params.favoritedUris || [], params.useWildcard || false, params.searchForEmails || false, params.isGrokAgeVerified || false, permutations);

    const messages: any[] = [];
    if (params.image) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                { 
                    type: 'image_url', 
                    image_url: {
                        url: `data:${params.image.mimeType};base64,${params.image.data}`
                    }
                }
            ]
        });
    } else {
        messages.push({ role: 'user', content: prompt });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${params.xaiApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            messages: messages,
            model: 'grok-4',
            temperature: 0.1,
            search_parameters: {
                mode: 'auto'
            },
            response_format: { type: 'json_object' }
        }),
        signal: params.signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let parsedMessage = '';
        try {
            const errorBody = JSON.parse(errorText);
            parsedMessage = errorBody.error?.message || errorBody.error || JSON.stringify(errorBody);
        } catch (e) {
            parsedMessage = errorText.substring(0, 200); // Truncate long HTML error pages
        }

        if (response.status === 401 || response.status === 403) {
            throw new Error(`Authentication error (${response.status}). Please check if your xAI API key is valid.`);
        }
        if (response.status === 429) {
            throw new Error(`Rate limit exceeded (${response.status}). Please wait before trying again.`);
        }
        throw new Error(`xAI API error (${response.status}): ${parsedMessage}`);
    }

    const data = await response.json();
    const textContent = data.choices[0]?.message?.content;
    
    if (textContent) {
        try {
            const parsedData = JSON.parse(textContent);
            
            // Basic validation
            if (typeof parsedData.summary !== 'string') parsedData.summary = "The AI returned an invalid summary.";
            if (!Array.isArray(parsedData.aliases)) parsedData.aliases = [];
            if (!Array.isArray(parsedData.results)) parsedData.results = [];
            if (!Array.isArray(parsedData.communityLinks)) parsedData.communityLinks = [];

            parsedData.results = parsedData.results.filter((res: any) => res && typeof res.uri === 'string' && (res.uri.startsWith('http') || res.uri.startsWith('mailto:')));
            parsedData.communityLinks = parsedData.communityLinks.filter((res: any) => res && typeof res.uri === 'string' && res.uri.startsWith('http'));

            return {
              summary: parsedData.summary,
              aliases: parsedData.aliases,
              results: parsedData.results,
              communityLinks: parsedData.communityLinks,
            };
        } catch (e) {
            console.error("Failed to parse JSON from xAI response", e, textContent);
            // Fall through to the error below
        }
    }
    
    throw new Error("The AI returned a response in an unexpected format or failed to generate valid JSON.");
}


// --- Main Exported Function ---

export async function findContent(params: FindContentParams): Promise<ApiResponse> {
  try {
    if (params.provider === 'gemini') {
      return await callGeminiApi(params);
    } else if (params.provider === 'grok') {
      return await callXaiApi(params);
    } else {
      throw new Error(`Unknown API provider: ${params.provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${params.provider} API:`, error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw cancellation errors
      }
      // Re-throw with more context
      throw new Error(`Failed to fetch data from ${params.provider} API. ${error.message}`);
    }
    // Fallback for non-Error objects
    throw new Error(`An unknown error occurred with the ${params.provider} API.`);
  }
}