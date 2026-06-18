import { serializeMerchantRuleStorage, type LocalMerchantData } from "@/lib/merchant-rules";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { createPrismaMerchantStore, type MerchantPersistenceStore } from "@/src/server/merchant-rules";

export async function replaceDurableMerchantData(
  context: AuthenticatedUserContext | null | undefined,
  data: LocalMerchantData,
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  serializeMerchantRuleStorage(data);
  return store.saveSnapshot(user.userId, data);
}
