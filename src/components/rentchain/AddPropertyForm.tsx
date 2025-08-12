import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PropertyType } from "@/types/property";

interface Props {
  onSubmit: (data: {
    title: string;
    description: string;
    pricePerDayEth: string;
    availableDays: number;
    imageUrl: string;
    type: PropertyType;
  }) => void;
  disabled?: boolean;
}

const AddPropertyForm = ({ onSubmit, disabled }: Props) => {
  const [type, setType] = useState<PropertyType>("apartamento");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") || "");
    const description = String(form.get("description") || "");
    const pricePerDayEth = String(form.get("pricePerDayEth") || "0");
    const availableDays = Number(form.get("availableDays") || 0);
    const imageUrl = String(form.get("imageUrl") || "");

    if (!title || !description || !imageUrl || availableDays <= 0) return;
    onSubmit({ title, description, pricePerDayEth, availableDays, imageUrl, type });
    (e.currentTarget as HTMLFormElement).reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" placeholder="Ex.: Apartamento moderno" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Imagem (URL)</Label>
          <Input id="imageUrl" name="imageUrl" placeholder="https://..." disabled={disabled} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" name="description" placeholder="Detalhes do imóvel" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePerDayEth">Preço por dia (ETH)</Label>
          <Input id="pricePerDayEth" name="pricePerDayEth" type="number" step="0.0001" min={0} placeholder="0.05" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="availableDays">Dias disponíveis</Label>
          <Input id="availableDays" name="availableDays" type="number" min={1} placeholder="10" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v: PropertyType) => setType(v)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartamento">Apartamento</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="loft">Loft</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="hero">Cadastrar imóvel</Button>
      </div>
    </form>
  );
};

export default AddPropertyForm;
