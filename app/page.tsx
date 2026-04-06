"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Leaf, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
// import "../lib/amplify";
import Image from "next/image";
import { getBrowserSupabase } from "@/lib/supabaseClient";


type Plant = {
  id: number;
  scientific_name?: string | null;
  common_name?: string | null;
  sanskrit_name?: string | null;
  common_names?: string | null;
  common_names_text?: string | null;
  family?: string | null;
  description?: string | null;
  parts_used?: string | null;
  medicinal_properties?: string | null;
  ailments?: string | null;
  uses?: string | null;
  dosage?: string | null;
  contraindications?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // added locally:
  _image_url?: string | null;
};


export default function HomePage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [selectedPartUsed, setSelectedPartUsed] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedAilment, setSelectedAilment] = useState<string>("");

  useEffect(() => {
    console.log(">>> useEffect FIRED <<<");
    let mounted = true;
  
    async function loadPlants() {
      console.log(">>> loadPlants() CALLED <<<");
      setLoading(true);
      setErrorMsg(null);
  
      try {
        console.log("=== START LOADING PLANTS ===");
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("Has API Key:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        
        // Create a manual fetch as fallback
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/plants?select=id,common_name,scientific_name,family,description&limit=100`;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        console.log("Fetch URL:", url);
        
      
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error("FETCH TIMEOUT - aborting");
          controller.abort();
        }, 8000);
        
        console.log("Starting fetch...");
        const fetchStart = Date.now();
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log("Fetch completed in", Date.now() - fetchStart, "ms");
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
        }
        
        console.log("Parsing JSON...");
        const data = await response.json();
        console.log("Fetched", data?.length, "plants");
        console.log("First plant:", data?.[0]);
        
        console.log("Plants query result:", data);

        if (!mounted) return;

        const plantsData = (data ?? []) as Plant[];
        console.log("Fetched plants count:", plantsData.length);
        
        if (!plantsData.length) {
          setPlants([]);
          setLoading(false);
          return;
        }

        // 2) fetch images for these plant ids
        const ids = plantsData.map((p) => p.id).filter(Boolean);
        const imagesMap: Record<number, { image_url?: string | null; storage_path?: string | null }> = {};

        try {
          const imgRes = await supabase
            .from("images")
            .select("id, plant_id, storage_path")
            .in("plant_id", ids)
            .limit(1000); // safety cap

          if (imgRes.error) {
            console.warn("Images fetch error (ignored):", imgRes.error);
          } else {
            const imgRows = imgRes.data ?? [];
            for (const r of imgRows as any[]) {
              // keep the first found image for plant_id (you can extend to choose priority)
              const pid = Number(r.plant_id);
              if (!imagesMap[pid]) {
                imagesMap[pid] = {
                  image_url: r.storage_path ?? null,
                  storage_path: r.storage_path ?? null,
                };
              }
            }
          }
        } catch (e) {
          console.warn("Images query threw (ignored):", e);
        }

        // 3) attach resolved image URL to each plant (prefer image_url, then storage_path, then metadata)
        const basePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
        const normalized: Plant[] = plantsData.map((p) => ({
          ...p,
          _image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/plants/${p.id}.jpg`,
        }));
        // const normalized: Plant[] = data.map((p) => {
        //   const imgRec = imagesMap[p.id];
        //   let finalUrl: string | null = null;
          
        //   // console.log("image url for plant", p.id, finalUrl);

        //   if (imgRec?.image_url) {
        //     finalUrl = imgRec.image_url;
          
        //   } else if (imgRec?.storage_path) {
        //     const sp = String(imgRec.storage_path);
          
        //     if (basePublicUrl) {
        //       if (sp.startsWith("http://") || sp.startsWith("https://")) {
        //         finalUrl = sp;
        //       } else {
        //         finalUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/plants/${p.id}.jpg`;
        //       }
        //     } else {
        //       finalUrl = sp;
        //     }
          
        //   } else {
        //     finalUrl = null;
        //   }
          
        //   return {
        //     ...p,
        //     _image_url: finalUrl,
        //   };
        // });

        if (!mounted) return;
        setPlants(normalized);
      } catch (err) {
        console.error("Unexpected error fetching plants:", err);
        setErrorMsg((err as any)?.message ?? "Unexpected error");
        setPlants([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
  
    loadPlants();
    return () => {
      mounted = false;
    };
  }, []);
  
  
  // Build unique lists for filters
  const families = useMemo(() => Array.from(new Set(plants.map((p) => p.family).filter(Boolean as any))), [plants]);
  const partsUsed = useMemo(
    () =>
      Array.from(
        new Set(
          plants.flatMap((p) =>
            p.parts_used
              ? p.parts_used.split(",").map((s) => s.trim())
              : []
          )
        )
      ),
    [plants]
  );
  const properties = useMemo(
    () =>
      Array.from(
        new Set(
          plants.flatMap((p) =>
            p.medicinal_properties
              ? p.medicinal_properties.split(",").map((s) => s.trim())
              : []
          )
        )
      ),
    [plants]
  );
  const ailments = useMemo(
    () =>
      Array.from(
        new Set(
          plants.flatMap((p) =>
            p.ailments
              ? p.ailments.split(",").map((s) => s.trim())
              : []
          )
        )
      ),
    [plants]
  );

  // Client-side filtering
  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (p.common_name?.toLowerCase().includes(q) ?? false) ||
        (p.scientific_name?.toLowerCase().includes(q) ?? false) ||
        (p.common_names_text?.toLowerCase().includes(q) ?? false);

      const matchesFamily = !selectedFamily || p.family === selectedFamily;
      const matchesPart =
  !selectedPartUsed ||
  (p.parts_used
    ? p.parts_used.split(",").map((s) => s.trim()).includes(selectedPartUsed)
    : false);

const matchesProp =
  !selectedProperty ||
  (p.medicinal_properties
    ? p.medicinal_properties.split(",").map((s) => s.trim()).includes(selectedProperty)
    : false);

const matchesAil =
  !selectedAilment ||
  (p.ailments
    ? p.ailments.split(",").map((s) => s.trim()).includes(selectedAilment)
    : false);
      return matchesQuery && matchesFamily && matchesPart && matchesProp && matchesAil;
    });
  }, [plants, searchQuery, selectedFamily, selectedPartUsed, selectedProperty, selectedAilment]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFamily("");
    setSelectedPartUsed("");
    setSelectedProperty("");
    setSelectedAilment("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading plants…</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-destructive mb-4">{errorMsg}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-balance mb-4">
            Comprehensive Database of <span className="text-primary">Ayurvedic Plants</span>
          </h2>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Explore traditional medicinal plants with detailed information on properties, preparations, and therapeutic uses
            backed by scientific research.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{plants.length}</div>
              <div className="text-sm text-muted-foreground">Medicinal Plants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">{families.length}</div>
              <div className="text-sm text-muted-foreground">Plant Families</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-3 mb-2">{properties.length}</div>
              <div className="text-sm text-muted-foreground">Properties</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plants by name, properties, or ailments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Family select */}
{/* Family select */}
<Select value={selectedFamily} onValueChange={setSelectedFamily}>
  <SelectTrigger>
    <SelectValue placeholder="Family" />
  </SelectTrigger>
  <SelectContent>
    {families.length === 0 ? (
      <SelectItem value="__none" disabled>
        No families
      </SelectItem>
    ) : (
      families
        .map((f) => String(f ?? "").trim())
        .filter((f) => f !== "")
        .map((f, idx) => (
          <SelectItem key={`family-${f}-${idx}`} value={f}>
            {f}
          </SelectItem>
        ))
    )}
  </SelectContent>
</Select>

{/* Part Used select */}
<Select value={selectedPartUsed} onValueChange={setSelectedPartUsed}>
  <SelectTrigger>
    <SelectValue placeholder="Care requirements" />
  </SelectTrigger>
  <SelectContent>
    {partsUsed.length === 0 ? (
      <SelectItem value="__none" disabled>
        No care
      </SelectItem>
    ) : (
      partsUsed
        .map((p) => String(p ?? "").trim())
        .filter((p) => p !== "")
        .map((p, idx) => (
          <SelectItem key={`part-${p}-${idx}`} value={p}>
            {p}
          </SelectItem>
        ))
    )}
  </SelectContent>
</Select>

{/* Property select */}
<Select value={selectedProperty} onValueChange={setSelectedProperty}>
  <SelectTrigger>
    <SelectValue placeholder="Property" />
  </SelectTrigger>
  <SelectContent>
    {properties.length === 0 ? (
      <SelectItem value="__none" disabled>
        No properties
      </SelectItem>
    ) : (
      properties
        .map((pr) => String(pr ?? "").trim())
        .filter((pr) => pr !== "")
        .map((pr, idx) => (
          <SelectItem key={`prop-${pr}-${idx}`} value={pr}>
            {pr}
          </SelectItem>
        ))
    )}
  </SelectContent>
</Select>

{/* Ailment select */}
<Select value={selectedAilment} onValueChange={setSelectedAilment}>
  <SelectTrigger>
    <SelectValue placeholder="Ailment" />
  </SelectTrigger>
  <SelectContent>
    {ailments.length === 0 ? (
      <SelectItem value="__none" disabled>
        No ailments
      </SelectItem>
    ) : (
      ailments
        .map((a) => String(a ?? "").trim())
        .filter((a) => a !== "")
        .map((a, idx) => (
          <SelectItem key={`ailment-${a}-${idx}`} value={a}>
            {a}
          </SelectItem>
        ))
    )}
  </SelectContent>
</Select>


            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredPlants.length} of {plants.length} plants
              </div>
              {(searchQuery || selectedFamily || selectedPartUsed || selectedProperty || selectedAilment) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>

          {filteredPlants.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/20 rounded-lg inline-block mb-4">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No plants found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search criteria or clearing the filters.</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2025 Ayush Plant Database. Traditional knowledge for modern wellness.</p>
        </div>
      </footer>
    </div>
  );
}

function PlantCard({ plant }: { plant: Plant }) {
  // priority: _image_url (from images table) -> metadata.image/_image_url -> placeholder
  const fallback = "public/placeholder.png?height=200&width=300";
  // const candidate = plant._image_url ?? plant.metadata?.image ?? plant.metadata?.image_url ?? fallback;
  const candidate = plant._image_url ?? fallback;
  // If candidate is null or empty -> use fallback
  const imgSrc = candidate || fallback;

  return (
    <Link href={`/plants/${plant.id}`}>
      <Card className="plant-card-hover transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-full">
        <div className="aspect-video relative overflow-hidden rounded-t-lg">
          <Image
            src={String(imgSrc)}
            alt={plant.common_name ?? "plant"}
            fill
            unoptimized={true} // allow external URLs without configuring domains in next.config.js
            className="object-contain bg-muted transition-transform duration-200 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "public/placeholder.png";
            }}
          />
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight text-balance">{plant.common_name}</CardTitle>
              <CardDescription className="text-sm">
                <em>{plant.scientific_name}</em>
              </CardDescription>
              {plant.sanskrit_name && <CardDescription className="text-xs text-accent">{plant.sanskrit_name}</CardDescription>}
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {plant.family}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{plant.description}</p>

          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Care requirments</div>
              <div className="flex flex-wrap gap-1">
  {(plant.parts_used ? plant.parts_used.split(",").map(s => s.trim()) : [])
    .slice(0, 3)
    .map((part, idx) => (
      <Badge key={`${plant.id}-part-${idx}`} variant="outline" className="text-xs">
        {part}
      </Badge>
  ))}

  {(plant.parts_used ? plant.parts_used.split(",").length : 0) > 3 && (
    <Badge variant="outline" className="text-xs">
      +{(plant.parts_used?.split(",").length ?? 0) - 3}
    </Badge>
  )}
</div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Key Properties</div>
              <div className="flex flex-wrap gap-1">
  {(plant.medicinal_properties
    ? plant.medicinal_properties.split(",").map(s => s.trim())
    : []
  )
    .slice(0, 2)
    .map((property, idx) => (
      <Badge key={`${plant.id}-prop-${idx}`} variant="secondary" className="text-xs">
        {property}
      </Badge>
  ))}

  {(plant.medicinal_properties
    ? plant.medicinal_properties.split(",").length
    : 0) > 2 && (
    <Badge variant="secondary" className="text-xs">
      +{(plant.medicinal_properties?.split(",").length ?? 0) - 2}
    </Badge>
  )}
</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
