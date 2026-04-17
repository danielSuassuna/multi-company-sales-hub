import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleString("pt-BR");

const Pedidos = () => {
  const { empresaId } = useAuth();
  const [vendas, setVendas] = useState<any[]>([]);
  const [pedidosPorVenda, setPedidosPorVenda] = useState<Record<number, any[]>>({});

  useEffect(() => { document.title = "Pedidos · Vendas Pro"; }, []);

  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      const { data: v } = await supabase.from("Venda").select("*").eq("id_empresa", empresaId).order("created_at", { ascending: false });
      setVendas(v ?? []);
      const { data: p } = await supabase.from("Pedido").select("*, Cardapio:id_cardapio(Nome, Valor)").eq("id_empresa", empresaId);
      const map: Record<number, any[]> = {};
      (p ?? []).forEach((x: any) => {
        if (!x.id_venda) return;
        map[x.id_venda] ??= [];
        map[x.id_venda].push(x);
      });
      setPedidosPorVenda(map);
    })();
  }, [empresaId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold">Pedidos</h1>
        <p className="text-muted-foreground">Histórico de vendas</p>
      </header>

      <div className="space-y-3">
        {vendas.map((v) => {
          const peds = pedidosPorVenda[v.id] ?? [];
          const total = peds.reduce((s, p) => s + (p.Cardapio?.Valor ?? 0), 0);
          return (
            <Card key={v.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">Venda #{v.id}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(v.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{peds.length} item(s)</div>
                  <div className="text-lg font-semibold text-primary">{fmt(total)}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-x-2">
                {peds.map((p) => <span key={p.id} className="inline-block px-2 py-0.5 bg-muted rounded">{p.Cardapio?.Nome}</span>)}
              </div>
            </Card>
          );
        })}
        {vendas.length === 0 && <Card className="p-6 text-center text-muted-foreground">Nenhum pedido ainda.</Card>}
      </div>
    </div>
  );
};

export default Pedidos;
