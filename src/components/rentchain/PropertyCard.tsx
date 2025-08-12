import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEther } from "viem";
import { Property } from "@/types/property";
import { Calendar, KeyRound } from "lucide-react";

interface Props {
  property: Property;
  onRentClick: (property: Property) => void;
}

function shortAddress(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

const PropertyCard = ({ property, onRentClick }: Props) => {
  const unavailable = property.availableDays <= 0;

  return (
    <Card className={`overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg ${unavailable ? "opacity-60" : ""}`}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={property.imageUrl}
          alt={`${property.title} — aluguel de imóvel ${property.type}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary" className="backdrop-blur">
            {property.type}
          </Badge>
          {unavailable && <Badge variant="outline">Indisponível</Badge>}
        </div>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{property.title}</span>
          <span className="text-base font-medium text-muted-foreground">
            {formatEther(property.pricePerDayWei)} ETH/dia
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{property.description}</p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1"><Calendar className="size-4" /> {property.availableDays} dias</span>
          <span className="inline-flex items-center gap-1"><KeyRound className="size-4" /> {shortAddress(property.owner)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant={unavailable ? "secondary" : "default"}
          disabled={unavailable}
          onClick={() => onRentClick(property)}
        >
          Alugar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
