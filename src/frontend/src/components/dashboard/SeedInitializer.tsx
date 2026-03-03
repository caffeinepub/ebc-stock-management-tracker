import { useEffect, useRef } from "react";
import { useActor } from "../../hooks/useActor";
import {
  useBeverageItems,
  useGiftItems,
  usePrefilledItems,
} from "../../hooks/useQueries";
import { BEVERAGE_ITEMS_SEED, GIFT_ITEMS_SEED } from "../../lib/seedData";

/**
 * This component silently seeds the 49 default items on first admin login.
 * It checks if items already exist before seeding.
 */
export function SeedInitializer() {
  const { actor, isFetching } = useActor();
  const giftsQuery = useGiftItems();
  const beveragesQuery = useBeverageItems();
  const prefilledItems = usePrefilledItems();
  const seededRef = useRef(false);

  useEffect(() => {
    if (
      seededRef.current ||
      isFetching ||
      !actor ||
      giftsQuery.isPending ||
      beveragesQuery.isPending
    ) {
      return;
    }

    const giftsCount = giftsQuery.data?.length ?? 0;
    const beveragesCount = beveragesQuery.data?.length ?? 0;

    // Only seed if both categories are empty
    if (giftsCount === 0 && beveragesCount === 0) {
      seededRef.current = true;
      prefilledItems.mutate({
        gifts: GIFT_ITEMS_SEED,
        beverages: BEVERAGE_ITEMS_SEED,
      });
    }
  }, [
    actor,
    isFetching,
    giftsQuery.isPending,
    giftsQuery.data,
    beveragesQuery.isPending,
    beveragesQuery.data,
    prefilledItems,
  ]);

  return null;
}
