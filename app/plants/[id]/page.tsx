// app/plants/[id]/page.tsx  (SERVER FILE — no "use client")
import PlantDetailPage from "@/components/ui/PlantDetailPage";

export const dynamicParams = false;

// export async function generateStaticParams() {
//   const supa = createClient(
//     process.env.SUPABASE_URL!,           // server env (build-time)
//     process.env.SUPABASE_SERVICE_KEY!    // server env (build-time)
//   );
//   const { data, error } = await supa.from("plants").select("id").limit(1000);
//   if (error) {
//     console.error("Failed to fetch plant ids", error);
//     return [];
//   }
//   return (data ?? []).map((row: { id: string | number }) => ({ id: String(row.id) }));
// }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlantDetailPage id={id} />;
}
