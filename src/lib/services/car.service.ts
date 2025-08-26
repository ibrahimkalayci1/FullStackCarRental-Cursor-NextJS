import { Car, CarsResponse } from "@/types";
import { headers } from "next/headers";

async function getBaseUrl(): Promise<string> {
  if (typeof window !== "undefined") {
    return ""; // use relative URLs on client
  }
  const h = await headers();
  const protocol = h.get("x-forwarded-proto") ?? "http";
  const host =
    h.get("host") ??
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") ??
    "localhost:3000";
  return `${protocol}://${host}`;
}

export async function getPopularCars(): Promise<Car[]> {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/cars?limit=4&sortBy=averageRating&sortOrder=desc`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch popular cars");
    }

    const data: CarsResponse = await response.json();
    return data.cars;
  } catch (error) {
    console.error("Error fetching popular cars:", error);
    return [];
  }
}

export async function getRecommendedCars(): Promise<Car[]> {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/cars?limit=8&sortBy=createdAt&sortOrder=desc`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recommended cars");
    }

    const data: CarsResponse = await response.json();
    return data.cars;
  } catch (error) {
    console.error("Error fetching recommended cars:", error);
    return [];
  }
}

export async function getCars(params?: {
  search?: string;
  type?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<CarsResponse> {
  try {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const baseUrl = await getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/cars?${searchParams.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cars");
    }

    const data: CarsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching cars:", error);
    return {
      cars: [],
      pagination: {
        page: 1,
        limit: 12,
        totalPages: 0,
        totalCars: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

export async function getCarById(id: string): Promise<Car | null> {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/cars/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch car");
    }

    const data = await response.json();
    return data.car;
  } catch (error) {
    console.error("Error fetching car:", error);
    return null;
  }
}

export async function getCarDetails(carId: string) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/cars/${carId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Car not found");
  }

  return response.json();
}
