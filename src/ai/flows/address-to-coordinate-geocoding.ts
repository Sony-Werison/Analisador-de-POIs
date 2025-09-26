'use server';

/**
 * @fileOverview A geocoding AI agent that converts addresses to coordinates.
 *
 * - addressToCoordinateGeocoding - A function that handles the geocoding process.
 * - AddressToCoordinateGeocodingInput - The input type for the addressToCoordinateGeocoding function.
 * - AddressToCoordinateGeocodingOutput - The return type for the addressToCoordinateGeocoding function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AddressToCoordinateGeocodingInputSchema = z.object({
  address: z.string().describe('The address to geocode.'),
});
export type AddressToCoordinateGeocodingInput = z.infer<typeof AddressToCoordinateGeocodingInputSchema>;

const AddressToCoordinateGeocodingOutputSchema = z.object({
  latitude: z.number().describe('The latitude of the address.'),
  longitude: z.number().describe('The longitude of the address.'),
});
export type AddressToCoordinateGeocodingOutput = z.infer<typeof AddressToCoordinateGeocodingOutputSchema>;

export async function addressToCoordinateGeocoding(input: AddressToCoordinateGeocodingInput): Promise<AddressToCoordinateGeocodingOutput> {
  return addressToCoordinateGeocodingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'addressToCoordinateGeocodingPrompt',
  input: {schema: AddressToCoordinateGeocodingInputSchema},
  output: {schema: AddressToCoordinateGeocodingOutputSchema},
  prompt: `You are a geocoding expert. Given an address, you will return the latitude and longitude of the address.\n\nAddress: {{{address}}}`,
});

const addressToCoordinateGeocodingFlow = ai.defineFlow(
  {
    name: 'addressToCoordinateGeocodingFlow',
    inputSchema: AddressToCoordinateGeocodingInputSchema,
    outputSchema: AddressToCoordinateGeocodingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
