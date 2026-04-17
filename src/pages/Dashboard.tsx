import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Stat = ({ icon: Icon, label, value, accent }: any) => (
  <Card className="p-5 shadow-card">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </div>
      <div className={`p-2 rounded-lg ${accent}`}><Icon className="h-5 w-5" /></div>
    </div>
  </Card>
);

const Dashboard = () => {
  const { empresaId, empresaNome } = useAuth();
  const [vendas, setVendas] = useState(0);
  const [pedidos, setPedidos] = useState(0);
  const [receita, setReceita] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [topProdutos, setTopProdutos] = useState<{ nome: string; qtd: number }[]>([]);

  useEffect(() => { document.title = "Dashboard · Vendas Pro"; }, []);

  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      const { data: vData } = await supabase.from("Venda").select("id").eq("id_empresa", empresaId);
      setVendas(vData?.length ?? 0);

      const { data: pData } = await supabase
        .from("Pedido")
        .select("id, Cardapio:id_cardapio(Nome, Valor)")
        .eq("id_empresa", empresaId);
      setPedidos(pData?.length ?? 0);
      let total = 0;
      const counter: Record<string, number> = {};
      (pData ?? []).forEach((p: any) => {
        total += p.Cardapio?.Valor ?? 0;
        const nome = p.Cardapio?.Nome ?? "—";
        counter[nome] = (counter[nome] ?? 0) + 1;
      });
      setReceita(total);
      setTopProdutos(
        Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nome, qtd]) => ({ nome, qtd }))
      );

      const { data: gData } = await supabase.from("Gastos").select("Valor").eq("id_empresa", empresaId);
      setGastos((gData ?? []).reduce((s, g) => s + (g.Valor ?? 0), 0));
    })();
  }, [empresaId]);

  const lucro = receita - gastos;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold">Olá{empresaNome ? `, ${empresaNome}` : ""}</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={DollarSign} label="Receita" value={fmt(receita)} accent="bg-primary/15 text-primary" />
        <Stat icon={ShoppingCart} label="Vendas" value={vendas} accent="bg-success/15 text-success" />
        <Stat icon={Wallet} label="Gastos" value={fmt(gastos)} accent="bg-destructive/15 text-destructive" />
        <Stat icon={TrendingUp} label="Lucro" value={fmt(lucro)} accent="bg-warning/15 text-warning" />
      </div>

      <Card className="p-5 shadow-card">
        <h2 className="font-semibold mb-4">Top produtos vendidos</h2>
        {topProdutos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma venda registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {topProdutos.map((p) => (
              <div key={p.nome} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span>{p.nome}</span>
                <span className="text-sm text-muted-foreground">{p.qtd} vendidos</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 shadow-card">
        <h2 className="font-semibold mb-2">Total de pedidos</h2>
        <div className="text-3xl font-semibold text-primary">{pedidos}</div>
      </Card>
    </div>
  );
};

export default Dashboard;
