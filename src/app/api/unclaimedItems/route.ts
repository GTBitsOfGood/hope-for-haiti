import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { internalError, authenticationError, successResponse } from '@/util/responses';
import { db } from '@/db';

/**
 * Handles GET requests to retrieve unclaimed items from the unclaimedItem database.
 *
 * @returns {NextResponse} On success, returns a status of 200 and a JSON object containing an array of unclaimed items.
 * @returns {NextResponse} On authentication error, returns a status of 401 and a JSON object containing an error message.
 * @returns {NextResponse} On error, returns a status of 500 and a JSON object containing an error message.
 *
 * @example
 * // Example response:
 * {
 *   "unclaimedItems": [
 *     {
 *       "id": 1,
 *       "name": "Banana",
 *       "quantity": 10,
 *       "expirationDate": "2025-01-22T14:45:43.241Z"
 *     },
 *     {
 *       "id": 2,
 *       "name": "Apple",
 *       "quantity": 100,
 *       "expirationDate": "2025-01-22T14:45:43.243Z"
 *     }
 *   ]
 * }
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session) return authenticationError('Session required');
        
        // Get all unclaimed items
        const unclaimedItems = await db.unclaimedItem.findMany();

        return successResponse({ unclaimedItems });
    } catch (err: any) {
        console.error(err?.message);
        return internalError();
    }
}