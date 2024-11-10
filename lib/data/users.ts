"use server";

import { db } from "../db";
import { users, endpoints } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { authenticatedAction } from "./safe-action";

/**
 * Increments the lead count for a user
 *
 * Used to track the number of leads a user has received
 */
export const incrementLeadCount = async (endpointId: string) => {
  await db
    .update(users)
    .set({ leadCount: sql`${users.leadCount} + 1` })
    .where(
      eq(
        users.id,
        db
          .select({ userId: endpoints.userId })
          .from(endpoints)
          .where(eq(endpoints.id, endpointId))
          .limit(1)
      )
    );
};

/**
 * Retrieves the lead count for a specific endpoint
 *
 * @returns The lead count associated with the endpoint's user
 * @throws Error if the endpoint is not found or not associated with a user
 */
export const getLeadCount = async (endpointId: string) => {
  const result = await db
    .select({ leadCount: users.leadCount })
    .from(users)
    .innerJoin(endpoints, eq(users.id, endpoints.userId))
    .where(eq(endpoints.id, endpointId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Endpoint not found or not associated with a user");
  }

  return result[0].leadCount;
};

/**
 * Clears the lead count for all users
 *
 * Runs once a month on a CRON trigger
 */
export const clearLeadCount = async () => {
  await db.update(users).set({ leadCount: 0 });
};

/**
 * Retrieves the lead count for specific user
 *
 * Authenticated action
 */

export const getUsageForUser = authenticatedAction.action(
  async ({ ctx: { userId } }) => {
    const result = await db
      .select({ leadCount: users.leadCount })
      .from(users)
      .where(eq(users.id, userId));

    if (result.length === 0) {
      throw new Error("User not found");
    }

    return result[0].leadCount;
  }
);
