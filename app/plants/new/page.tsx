"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export default function NewPlantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    common_name: "",
    scientific_name: "",
    sanskrit_name: "",
    family: "",
    description: "",
    parts_used: "",
    medicinal_properties: "",
    ailments: "",
    dosage: "",
    contraindications: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getBrowserSupabase();

      // Convert comma-separated strings to arrays
      const plantData = {
        ...formData,
        parts_used: formData.parts_used.split(",").map(s => s.trim()).filter(Boolean),
        medicinal_properties: formData.medicinal_properties.split(",").map(s => s.trim()).filter(Boolean),
        ailments: formData.ailments.split(",").map(s => s.trim()).filter(Boolean),
      };

      console.log("Inserting plant:", plantData);

      const { data, error: insertError } = await supabase
        .from("plants")
        .insert([plantData])
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      console.log("Plant created:", data);
      
      // Redirect to the new plant's detail page
      router.push(`/plants/${data.id}`);
    } catch (err: any) {
      console.error("Error creating plant:", err);
      setError(err.message || "Failed to create plant");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add New Plant</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="common_name">Common Name *</Label>
                  <Input
                    id="common_name"
                    name="common_name"
                    value={formData.common_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Ashwagandha"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scientific_name">Scientific Name *</Label>
                  <Input
                    id="scientific_name"
                    name="scientific_name"
                    value={formData.scientific_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Withania somnifera"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sanskrit_name">Sanskrit Name</Label>
                  <Input
                    id="sanskrit_name"
                    name="sanskrit_name"
                    value={formData.sanskrit_name}
                    onChange={handleChange}
                    placeholder="e.g., Aśvagandhā"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family">Family *</Label>
                  <Input
                    id="family"
                    name="family"
                    value={formData.family}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Solanaceae"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Detailed description of the plant..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parts_used">Parts Used (comma-separated) *</Label>
                <Input
                  id="parts_used"
                  name="parts_used"
                  value={formData.parts_used}
                  onChange={handleChange}
                  required
                  placeholder="e.g., root, leaf, seed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicinal_properties">Medicinal Properties (comma-separated) *</Label>
                <Input
                  id="medicinal_properties"
                  name="medicinal_properties"
                  value={formData.medicinal_properties}
                  onChange={handleChange}
                  required
                  placeholder="e.g., adaptogenic, anti-inflammatory, antioxidant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ailments">Ailments Treated (comma-separated) *</Label>
                <Input
                  id="ailments"
                  name="ailments"
                  value={formData.ailments}
                  onChange={handleChange}
                  required
                  placeholder="e.g., stress, anxiety, insomnia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Textarea
                  id="dosage"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Recommended dosage information..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraindications">Contraindications</Label>
                <Textarea
                  id="contraindications"
                  name="contraindications"
                  value={formData.contraindications}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Any warnings or contraindications..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Plant"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
