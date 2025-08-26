import Link from "next/link";
import { getPopularCars } from "@/lib/services/car.service";
import CarCard from "./CarCard";

export default async function PopularCars() {
  const popularCars = await getPopularCars();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Popular Car</h2>
        <Link href="/cars" className="text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {popularCars?.map((car) => (
          <CarCard key={car._id} car={car} />
        ))}
      </div>
    </section>
  );
}
