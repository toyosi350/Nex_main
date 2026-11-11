import { useGetShopProductsQuery } from "../api/shopApi";

/*
 * One shared catalog query for the whole storefront: every section
 * (best sellers, for you, vendors, category, cart, ...) subscribes to
 * the same RTK Query cache entry, so the catalog is fetched once and
 * kept fresh together. Returns the same contract the sections used
 * before: { products, status, error }.
 */
export default function useProducts() {
  const { data, isLoading, isFetching, isError, error } =
    useGetShopProductsQuery();

  return {
    products: data?.products || [],
    status: isLoading ? "loading" : isError ? "error" : "success",
    isFetching,
    isError,
    error,
  };
}
