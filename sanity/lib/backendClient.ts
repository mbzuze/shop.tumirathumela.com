
import { createClient } from 'next-sanity';

export const backendClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2023-05-03',
    useCdn: false,
    token: process.env.SANITY_SECRET_TOKEN,
});
