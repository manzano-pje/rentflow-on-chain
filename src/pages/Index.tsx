import hero from "@/assets/hero-rentchain.jpg";
import WalletConnectButton from "@/components/rentchain/WalletConnectButton";
import PropertyCard from "@/components/rentchain/PropertyCard";
import AddPropertyForm from "@/components/rentchain/AddPropertyForm";
import RentDialog from "@/components/rentchain/RentDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { useAccount } from "wagmi";
import type { Property, PropertyType } from "@/types/property";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const { address } = useAccount();
  const [rentOpen, setRentOpen] = useState(false);
  const [rentTarget, setRentTarget] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([
    {
      id: crypto.randomUUID(),
      title: "Apartamento moderno",
      description: "Apartamento iluminado com varanda e vista para a cidade.",
      pricePerDayWei: parseEther("0.05"),
      availableDays: 12,
      imageUrl: "https://images.unsplash.com/photo-1505692794403-34d4982ccb90?q=80&w=1600&auto=format&fit=crop",
      type: "apartamento",
      owner: "0x1234567890abcdef1234567890abcdef12345678",
    },
    {
      id: crypto.randomUUID(),
      title: "Casa espaçosa",
      description: "Casa familiar com jardim amplo e área gourmet.",
      pricePerDayWei: parseEther("0.08"),
      availableDays: 8,
      imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600&auto=format&fit=crop",
      type: "casa",
      owner: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
    },
    {
      id: crypto.randomUUID(),
      title: "Studio compacto",
      description: "Studio bem localizado, ideal para viagens rápidas.",
      pricePerDayWei: parseEther("0.03"),
      availableDays: 15,
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop",
      type: "studio",
      owner: "0x1111111111111111111111111111111111111111",
    },
    {
      id: crypto.randomUUID(),
      title: "Loft industrial",
      description: "Loft com pé-direito alto e design contemporâneo.",
      pricePerDayWei: parseEther("0.12"),
      availableDays: 0,
      imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop",
      type: "loft",
      owner: "0x9999999999999999999999999999999999999999",
    },
  ]);

  const sorted = [...properties].sort((a, b) => Number(a.availableDays <= 0) - Number(b.availableDays <= 0));

  const startRent = (property: Property) => {
    setRentTarget(property);
    setRentOpen(true);
  };

  const handleRent = (days: number) => {
    if (!rentTarget) return;
    if (!address) {
      toast({ title: "Conecte sua carteira", description: "Você precisa conectar para alugar." });
      return;
    }
    if (address.toLowerCase() === rentTarget.owner.toLowerCase()) {
      toast({ title: "Ação não permitida", description: "Proprietário não pode alugar seu próprio imóvel." });
      return;
    }
    if (days <= 0 || days > rentTarget.availableDays) {
      toast({ title: "Quantidade inválida", description: "Verifique os dias disponíveis." });
      return;
    }

    setProperties((prev) => prev.map((p) => (p.id === rentTarget.id ? { ...p, availableDays: p.availableDays - days } : p)));
    toast({
      title: "Aluguel confirmado",
      description: `Você pagará ${Number(formatEther(rentTarget.pricePerDayWei)) * days} ETH por ${days} diária(s).`,
    });
    setRentOpen(false);
  };

  const handleAdd = (data: {
    title: string;
    description: string;
    pricePerDayEth: string;
    availableDays: number;
    imageUrl: string;
    type: PropertyType;
  }) => {
    if (!address) {
      toast({ title: "Conecte sua carteira", description: "Você precisa conectar para cadastrar." });
      return;
    }
    const newP: Property = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      pricePerDayWei: parseEther(data.pricePerDayEth || "0"),
      availableDays: data.availableDays,
      imageUrl: data.imageUrl,
      type: data.type,
      owner: address,
    };
    setProperties((prev) => [newP, ...prev]);
    toast({ title: "Imóvel cadastrado", description: `${data.title} foi adicionado com sucesso.` });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto flex items-center justify-between py-4">
          <a href="#" className="text-lg font-semibold">RentChain</a>
          <nav className="flex items-center gap-6" aria-label="Principal">
            <a href="#imoveis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Imóveis</a>
            <a href="#cadastrar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cadastrar</a>
            <WalletConnectButton />
          </nav>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="absolute inset-0 -z-10">
            <img src={hero} alt="Cenário urbano moderno com conceito blockchain" className="h-[420px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
          <div className="container mx-auto flex min-h-[360px] flex-col items-start justify-center gap-6 py-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Aluguel Descentralizado de Imóveis</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Conecte sua carteira, cadastre propriedades e alugue com segurança usando contratos inteligentes.
            </p>
            <div className="flex gap-3">
              <a href="#cadastrar" className="inline-block"><span className="sr-only">Ir para cadastro</span>
                <button className="hero-gradient rounded-md px-6 py-3 text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5">
                  Cadastrar imóvel
                </button>
              </a>
              <a href="#imoveis" className="inline-block">
                <button className="rounded-md border border-input bg-background px-6 py-3 hover:bg-accent hover:text-accent-foreground">Ver imóveis</button>
              </a>
            </div>
          </div>
        </section>

        <section id="imoveis" className="container mx-auto py-12">
          <h2 className="mb-6 text-2xl font-semibold">Imóveis disponíveis</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p) => (
              <PropertyCard key={p.id} property={p} onRentClick={startRent} />
            ))}
          </div>
        </section>

        <section id="cadastrar" className="container mx-auto py-12">
          <h2 className="mb-6 text-2xl font-semibold">Cadastre seu imóvel</h2>
          <AddPropertyForm onSubmit={handleAdd} disabled={!address} />
          {!address && (
            <p className="mt-2 text-sm text-muted-foreground">Conecte sua carteira para cadastrar.</p>
          )}
        </section>
      </main>

      <RentDialog open={rentOpen} onOpenChange={setRentOpen} onConfirm={handleRent} />
    </div>
  );
};

export default Index;
