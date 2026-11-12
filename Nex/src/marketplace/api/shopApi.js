/**
 * Storefront API slice (RTK Query).
 *
 * One data layer for the whole app: the shared baseQuery (see
 * src/services/baseQuery.js) attaches the session token from the Redux
 * store, unwraps the backend's { success, data } envelope and handles
 * token refresh. This slice covers every /shop/* contract endpoint the
 * Nex_backend storefront exposes.
 */
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from '../../services/baseQuery.js'

/*
 * Curated storefront imagery. Catalog rows don't carry stored image
 * URLs, so we map each seeded product (by slug/id) to a photo that
 * actually matches what it is. Unknown products fall back to a stable
 * placeholder.
 */
const PRODUCT_IMAGES = {
  'apple-iphone-15-pro-256gb-abc-technologies': [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
    'https://images.unsplash.com/photo-1696446701796-da61225697cc',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5',
  ],
  'samsung-galaxy-s25-256gb-abc-technologies': [
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0',
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f',
  ],
  'oraimo-freepods-4-abc-technologies': [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
    'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46',
  ],
  'oraimo-powerbank-20000mah-abc-technologies': [
    'https://images.unsplash.com/photo-1609592424109-dd29d8f095e8',
    'https://images.unsplash.com/photo-1585338107529-13afc5f02586',
  ],
  'samsung-55-crystal-uhd-tv-abc-technologies': [
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1',
    'https://images.unsplash.com/photo-1461151304267-38535e780c79',
    'https://images.unsplash.com/photo-1601944179066-29786cb9d32a',
  ],
  'apple-watch-se-2024-gps-abc-technologies': [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a',
    'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9',
  ],
  'jbl-flip-6-speaker-abc-technologies': [
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1',
    'https://images.unsplash.com/photo-1589003077984-894e133dabab',
    'https://images.unsplash.com/photo-1545454675-3531b543be5d',
  ],
  'xiaomi-redmi-note-13-abc-technologies': [
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd',
  ],
  'hp-elitebook-840-g10-abuja-tech-distribution': [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef',
    'https://images.unsplash.com/photo-1484788984921-03950022c9ef',
  ],
  'lenovo-ideapad-slim-3-abuja-tech-distribution': [
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
  ],
  'asus-vivobook-15-abuja-tech-distribution': [
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2',
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
  ],
  'logitech-mx-master-3s-mouse-abuja-tech-distribution': [
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7',
  ],
  'kingston-1tb-nvme-ssd-abuja-tech-distribution': [
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b',
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea',
  ],
  'corsair-k70-rgb-keyboard-abuja-tech-distribution': [
    'https://images.unsplash.com/photo-1595225476474-87563907a212',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
  ],
  'hyperx-cloud-ii-headset-abuja-tech-distribution': [
    'https://images.unsplash.com/photo-1599669454699-248893623440',
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
  ],
  'nike-air-max-270-sneakers-benin-retail': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
  ],
  'men-s-canvas-casual-shoes-benin-retail': [
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
    'https://images.unsplash.com/photo-1463100099107-aa0980c362e6',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop',
  ],
  'ankara-print-wrapper-5-yards-benin-retail': [
    'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
  ],
  'ladies-leather-handbag-benin-retail': [
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    'https://images.unsplash.com/photo-1591561954557-26941169b49e',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa',
  ],
  'nivea-perfect-radiant-lotion-400ml-benin-retail': [
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571',
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b',
  ],
  'electric-blender-1-5l-benin-retail': [
    'https://images.unsplash.com/photo-1570222094114-d054a817e56b',
    'https://images.unsplash.com/photo-1585515320310-259814833e62',
  ],
  'baby-diapers-jumbo-pack-m-benin-retail': [
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4',
    'https://images.unsplash.com/photo-1555252333-9f8e92e65df9',
  ],
  'non-stick-frying-pan-set-benin-retail': [
    'https://images.unsplash.com/photo-1584990347449-a5d8f4f45a1f',
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1',
  ],
  'philips-hair-dryer-2000w-benin-retail': [
    'https://images.unsplash.com/photo-1522338140262-f46f5913618a',
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388',
  ],
  'honeywell-spaghetti-carton-kano-agro': [
    'https://images.unsplash.com/photo-1551462147-ff29053bfc14',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
  ],
  'jinja-canned-tomatoes-24-pack-kano-agro': [
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30',
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
  ],
  'makita-cordless-drill-18v-port-harcourt-industrial': [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc',
  ],
  'stanley-tape-measure-8m-port-harcourt-industrial': [
    'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f',
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122',
  ],
  'car-vacuum-cleaner-12v-port-harcourt-industrial': [
    'https://images.unsplash.com/photo-1558317374-067fb5f30001',
    'https://images.unsplash.com/photo-1603712725038-e9334ae8f39f',
  ],
  'motorcycle-helmet-full-face-port-harcourt-industrial': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87',
  ],
  'epson-ecotank-l3250-printer-prime-office-supplies': [
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6',
    'https://images.unsplash.com/photo-1589998059171-988d887df646',
  ],
  'logitech-c920-webcam-prime-office-supplies': [
    'https://images.unsplash.com/photo-1587826080692-f439cd0b70da',
    'https://images.unsplash.com/photo-1623949556303-b0d17d198863',
  ],
}

function productImageUrl(base, w = 600, h = 750) {
  if (!base) return ''
  if (base.includes('unsplash.com')) {
    const join = base.includes('?') ? '&' : '?'
    return `${base}${join}w=${w}&h=${h}&fit=crop&auto=format&q=80`
  }
  return base
}

export function productImage(seed, index = 0, w = 600, h = 750) {
  const key = seed || 'nex-product'
  const curated = PRODUCT_IMAGES[key]
  if (curated && curated.length) {
    return productImageUrl(curated[index % curated.length], w, h)
  }
  return `https://picsum.photos/seed/${encodeURIComponent(key)}${index ? `-${index}` : ''}/${w}/${h}`
}

/**
 * Backend shop product shape → the marketplace card shape the
 * storefront components render (image, price, originalPrice,
 * stockLeft, vendor, ...). Extra backend fields are kept alongside.
 */
export function toMarketplaceProduct(p) {
  if (!p) return p
  const seed = p.imageSeed || p.slug || p.id
  const uploadedImages = Array.isArray(p.images) ? p.images : []
  return {
    ...p,
    image: p.imageUrl || uploadedImages[0] || productImage(seed),
    images: uploadedImages.length
      ? uploadedImages
      : Array.from(
          { length: Math.min(p.imageCount || 1, 4) },
          (_, i) => productImage(seed, i),
        ),
    originalPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    stockLeft: p.available ?? p.stockLeft ?? 0,
    stock: p.available ?? p.stock ?? 0,
    vendor: p.vendorName || p.vendor,
    category: p.categoryName || p.category,
    categorySlug: p.category,
    description: p.shortDescription || p.description || '',
  }
}

/** Backend review row → the shape the product page renders. */
export function toMarketplaceReview(r) {
  if (!r) return r
  const name = r.shopperName || r.name || 'Nex-IV shopper'
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  const when = r.createdAt || r.date
  return {
    ...r,
    id: r.id,
    name,
    initials,
    rating: Number(r.rating) || 5,
    date: when,
    dateLabel: when
      ? new Date(when).toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    verified: !!r.verified,
    variant: r.variantSummary || r.variant || null,
    text: r.comment || r.text || '',
    helpful: r.helpful || 0,
    photos: r.photos || [],
  }
}

/** Backend shop order → the shape the order + account pages render. */
export function toMarketplaceOrder(o) {
  if (!o) return o
  return {
    ...o,
    items: (o.items || []).map((item) => ({
      ...item,
      image: productImage(item.imageSeed || item.slug || item.productId),
    })),
  }
}

export const shopApi = createApi({
  reducerPath: 'shopApi',
  baseQuery,
  tagTypes: [
    'ShopProducts',
    'ShopProduct',
    'ShopReviews',
    'ShopDeals',
    'ShopVendors',
    'ShopVendor',
    'Shopper',
    'ShopOrders',
    'ShopOrder',
  ],
  endpoints: (builder) => ({
    /* ---------- catalog ---------- */
    getShopProducts: builder.query({
      query: (params) => ({
        url: '/shop/products',
        params: { perPage: 200, ...(params || {}) },
      }),
      providesTags: ['ShopProducts'],
      transformResponse: (data) => ({
        ...data,
        products: (data.items || []).map(toMarketplaceProduct),
      }),
    }),
    getShopProductDetail: builder.query({
      query: (idOrSlug) => ({ url: `/shop/products/${idOrSlug}` }),
      providesTags: (_r, _e, id) => [{ type: 'ShopProduct', id }],
      transformResponse: (data) => ({
        ...toMarketplaceProduct(data),
        related: (data.related || []).map(toMarketplaceProduct),
      }),
    }),
    getProductReviews: builder.query({
      query: ({ productId, page = 1, perPage = 6 }) => ({
        url: `/shop/products/${productId}/reviews`,
        params: { page, perPage },
      }),
      providesTags: (_r, _e, arg) => [{ type: 'ShopReviews', id: arg?.productId }],
      transformResponse: (data) => ({
        ...data,
        items: (data.items || []).map(toMarketplaceReview),
      }),
    }),
    createProductReview: builder.mutation({
      query: ({ productId, ...body }) => ({
        url: `/shop/products/${productId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ShopReviews', id: arg.productId },
        { type: 'ShopProduct', id: arg.productId },
      ],
    }),
    getShopDeals: builder.query({
      query: () => ({ url: '/shop/deals' }),
      providesTags: ['ShopDeals'],
      transformResponse: (data) => ({
        ...data,
        products: (data.items || []).map(toMarketplaceProduct),
      }),
    }),
    getShopVendors: builder.query({
      query: () => ({ url: '/shop/vendors' }),
      providesTags: ['ShopVendors'],
    }),
    getShopVendorStore: builder.query({
      query: (slug) => ({ url: `/shop/vendors/${slug}` }),
      providesTags: (_r, _e, slug) => [{ type: 'ShopVendor', id: slug }],
      transformResponse: (data) => ({
        ...data,
        featuredProducts: (data.featuredProducts || []).map(toMarketplaceProduct),
      }),
    }),
    searchSuggest: builder.query({
      query: (q) => ({ url: '/shop/search/suggest', params: { q } }),
    }),

    /* ---------- shopper session ---------- */
    registerShopper: builder.mutation({
      query: (body) => ({ url: '/shop/auth/register', method: 'POST', body }),
    }),
    loginShopper: builder.mutation({
      query: (body) => ({ url: '/shop/auth/login', method: 'POST', body }),
    }),
    getShopMe: builder.query({
      query: () => ({ url: '/shop/auth/me' }),
      providesTags: ['Shopper'],
    }),
    getShopAddresses: builder.query({
      query: () => ({ url: '/shop/addresses' }),
      providesTags: ['Shopper'],
    }),
    addShopAddress: builder.mutation({
      query: (body) => ({ url: '/shop/addresses', method: 'POST', body }),
      invalidatesTags: ['Shopper'],
    }),
    deleteShopAddress: builder.mutation({
      query: (addressId) => ({ url: `/shop/addresses/${addressId}`, method: 'DELETE' }),
      invalidatesTags: ['Shopper'],
    }),

    /* ---------- orders ---------- */
    lookupShopOrder: builder.query({
      query: ({ number, email }) => ({
        url: '/shop/orders/lookup',
        params: { number, email },
      }),
    }),
    getShopOrders: builder.query({
      query: (params) => ({ url: '/shop/orders', params }),
      providesTags: ['ShopOrders'],
      transformResponse: (data) => ({
        ...data,
        items: (data.items || []).map(toMarketplaceOrder),
      }),
    }),
    getShopOrder: builder.query({
      query: (orderId) => ({ url: `/shop/orders/${orderId}` }),
      providesTags: (_r, _e, id) => [{ type: 'ShopOrder', id }],
      transformResponse: toMarketplaceOrder,
    }),
    createShopOrder: builder.mutation({
      query: (body) => ({ url: '/shop/orders', method: 'POST', body }),
      invalidatesTags: ['ShopOrders'],
    }),
    cancelShopOrder: builder.mutation({
      query: (orderId) => ({ url: `/shop/orders/${orderId}/cancel`, method: 'POST' }),
      invalidatesTags: ['ShopOrders'],
    }),
    submitVendorApplication: builder.mutation({
      query: (body) => ({ url: '/shop/vendor-applications', method: 'POST', body }),
    }),
    submitCareerApplication: builder.mutation({
      query: (body) => ({ url: '/shop/careers/applications', method: 'POST', body }),
    }),
  }),
})

export const {
  useGetShopProductsQuery,
  useGetShopProductDetailQuery,
  useGetProductReviewsQuery,
  useCreateProductReviewMutation,
  useGetShopDealsQuery,
  useGetShopVendorsQuery,
  useGetShopVendorStoreQuery,
  useSearchSuggestQuery,
  useRegisterShopperMutation,
  useLoginShopperMutation,
  useGetShopMeQuery,
  useGetShopAddressesQuery,
  useAddShopAddressMutation,
  useDeleteShopAddressMutation,
  useLookupShopOrderQuery,
  useGetShopOrdersQuery,
  useGetShopOrderQuery,
  useCreateShopOrderMutation,
  useCancelShopOrderMutation,
  useSubmitVendorApplicationMutation,
  useSubmitCareerApplicationMutation,
} = shopApi

export default shopApi
