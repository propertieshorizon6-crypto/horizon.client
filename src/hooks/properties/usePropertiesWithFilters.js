
import { useQuery } from "@tanstack/react-query";
import { getAllProperties, getFeaturedProperties } from "../../api/propertyApi";
import { transformPropertyResponse } from "../../utils/propertyTransform";

// Query keys with filters
export const propertyKeys = {
  all: ["properties"],
  filtered: (filters) => [...propertyKeys.all, "filtered", filters],
  featured: (filters) => [...propertyKeys.all, "featured", filters],
  new: (filters) => [...propertyKeys.all, "new", filters],
};


export function usePropertiesWithFilters(filters = {}, options = {}) {
  return useQuery({
    queryKey: propertyKeys.filtered(filters),
    queryFn: async () => {
      const params = buildQueryParams(filters);
      const response = await getAllProperties(params);
      const transformed = transformPropertyResponse(response);
      
      return {
        properties: transformed.properties,
        pagination: transformed.pagination,
      };
    },

    staleTime: 1000 * 30,      // 30s → reflect admin changes (e.g. unpublish) promptly
    gcTime: 1000 * 60 * 15,    // 15 min cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,

    ...options,
  });
}


export function useFeaturedPropertiesFiltered(filters = {}, options = {}) {
  return useQuery({
    queryKey: propertyKeys.featured(filters),
    queryFn: async () => {
      const params = {
        limit: 10,
        ...(filters.purpose && { purpose: filters.purpose }),
      };
      
      const response = await getFeaturedProperties(params);
      const transformed = transformPropertyResponse(response);
      return transformed.properties;  
    },

    staleTime: 1000 * 30,          // 30s → near-instant freshness for featured changes
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,          // refetch when ExplorePage mounts
    refetchOnWindowFocus: true,    // refetch when user returns to the tab

    ...options,
  });
}

export function useNewListingsFiltered(filters = {}, options = {}) {
  return useQuery({
    queryKey: propertyKeys.new(filters),
    queryFn: async () => {
      const params = {
        sort: 'newest',
        limit: filters.limit || 10,
        ...buildQueryParams(filters),
      };
      
      const response = await getAllProperties(params);
      const transformed = transformPropertyResponse(response);
      
      return {
        properties: transformed.properties,
        pagination: transformed.pagination,
      };
    },

    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: true,

    ...options,
  });
}

function buildQueryParams(filters) {
  const params = {};

  if (filters.search) {
    params.search = filters.search;
  }

  // Purpose (buy/rent)
  if (filters.purpose) {
    params.purpose = filters.purpose; // 'sale' or 'rent'
  }

  // Price range
  if (filters.minPrice) {
    params.minPrice = filters.minPrice;
  }
  if (filters.maxPrice) {
    params.maxPrice = filters.maxPrice;
  }

  // Bedrooms
  if (filters.bedrooms) {
    if (filters.bedrooms === '4+') {
      params.minBedrooms = 4;
    } else {
      params.minBedrooms = parseInt(filters.bedrooms);
      params.maxBedrooms = parseInt(filters.bedrooms);
    }
  }

  // Bathrooms
  if (filters.bathrooms) {
    if (filters.bathrooms === '4+') {
      params.minBathrooms = 4;
    } else {
      params.minBathrooms = parseInt(filters.bathrooms);
      params.maxBathrooms = parseInt(filters.bathrooms);
    }
  }

  // Property type
  if (filters.type) {
    params.type = filters.type;
  }

  // Location
  if (filters.city) {
    params.city = filters.city;
  }
  if (filters.state) {
    params.state = filters.state;
  }

  // Amenities
  if (filters.amenities && filters.amenities.length > 0) {
    params.amenities = filters.amenities.join(',');
  }

  // Sort
  if (filters.sort) {
    params.sort = filters.sort;
  }

  params.page = filters.page || 1;
  params.limit = filters.limit || 10;

  return params;
}

