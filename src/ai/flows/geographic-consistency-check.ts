// GeographicConsistencyCheck.ts
'use server';

/**
 * @fileOverview A flow that uses reverse geocoding to check if the state and city
 * information in a POI file matches the coordinates, identifying inconsistencies.
 *
 * - geographicConsistencyCheck - A function that handles the geographic consistency check process.
 * - GeographicConsistencyCheckInput - The input type for the geographicConsistencyCheck function.
 * - GeographicConsistencyCheckOutput - The return type for the geographicConsistencyCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeographicConsistencyCheckInputSchema = z.object({
  latitude: z.number().describe('The latitude of the POI.'),
  longitude: z.number().describe('The longitude of the POI.'),
  state: z.string().optional().describe('The state of the POI (optional).'),
  city: z.string().optional().describe('The city of the POI (optional).'),
});
export type GeographicConsistencyCheckInput = z.infer<typeof GeographicConsistencyCheckInputSchema>;

const GeographicConsistencyCheckOutputSchema = z.object({
  detectedState: z.string().nullable().describe('The state detected via reverse geocoding.'),
  detectedCity: z.string().nullable().describe('The city detected via reverse geocoding.'),
  stateMatch: z.boolean().describe('Whether the provided state matches the detected state.'),
  cityMatch: z.boolean().describe('Whether the provided city matches the detected city.'),
});
export type GeographicConsistencyCheckOutput = z.infer<typeof GeographicConsistencyCheckOutputSchema>;

export async function geographicConsistencyCheck(
  input: GeographicConsistencyCheckInput
): Promise<GeographicConsistencyCheckOutput> {
  return geographicConsistencyCheckFlow(input);
}

const reverseGeocodeTool = ai.defineTool({
  name: 'reverseGeocode',
  description: 'Looks up the geographic location (city, state) of given coordinates.',
  inputSchema: z.object({
    latitude: z.number().describe('Latitude of the location to look up.'),
    longitude: z.number().describe('Longitude of the location to look up.'),
  }),
  outputSchema: z.object({
    city: z.string().nullable().describe('The city of the location.'),
    state: z.string().nullable().describe('The state of the location.'),
  }),
},
async ({latitude, longitude}) => {
  // Use a real reverse geocoding service here.
  // This is a placeholder implementation.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.status, response.statusText);
      return {city: null, state: null};
    }
    const data = await response.json();
    return {state: data?.address?.state || null, city: data?.address?.city || data?.address?.town || data?.address?.village || null};
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return {state: null, city: null};
  }
});


const prompt = ai.definePrompt({
  name: 'geographicConsistencyCheckPrompt',
  tools: [reverseGeocodeTool],
  input: {
    schema: GeographicConsistencyCheckInputSchema,
  },
  output: {
    schema: GeographicConsistencyCheckOutputSchema,
  },
  prompt: `You are an AI assistant that checks the consistency of geographic data.

  The user will provide a latitude, longitude, state, and city.

  Your job is to use the reverseGeocode tool to determine the correct city and state for the given latitude and longitude, then determine if the provided state and city match the values returned by the reverseGeocode tool.

  Return the detectedState, detectedCity, stateMatch, and cityMatch in the output.

  Input:
  Latitude: {{{latitude}}}
  Longitude: {{{longitude}}}
  State: {{{state}}}
  City: {{{city}}}

  Output:`,
});

const geographicConsistencyCheckFlow = ai.defineFlow(
  {
    name: 'geographicConsistencyCheckFlow',
    inputSchema: GeographicConsistencyCheckInputSchema,
    outputSchema: GeographicConsistencyCheckOutputSchema,
  },
  async input => {
    const reverseGeocodeResult = await reverseGeocodeTool({
      latitude: input.latitude,
      longitude: input.longitude,
    });

    const stateMatch = input.state?.toLowerCase() === reverseGeocodeResult.state?.toLowerCase();
    const cityMatch = input.city?.toLowerCase() === reverseGeocodeResult.city?.toLowerCase();

    return {
      detectedState: reverseGeocodeResult.state,
      detectedCity: reverseGeocodeResult.city,
      stateMatch,
      cityMatch,
    };
  }
);
