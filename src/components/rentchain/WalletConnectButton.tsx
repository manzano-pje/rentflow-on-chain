import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { toast } from "@/hooks/use-toast";

function shortAddress(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

const WalletConnectButton = () => {
  const { address, status } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    try {
      const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
      await connect({ connector: injected });
    } catch (e: any) {
      toast({ title: "Falha ao conectar", description: e?.message ?? "Tente novamente." });
    }
  };

  if (!address) {
    return (
      <Button variant="hero" size="lg" onClick={handleConnect} aria-label="Conectar carteira">
        Conectar Carteira
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" aria-label="Endereço conectado">
        {shortAddress(address)}
      </Button>
      <Button variant="outline" size="sm" onClick={() => disconnect()} aria-label="Desconectar carteira">
        Desconectar
      </Button>
    </div>
  );
};

export default WalletConnectButton;
