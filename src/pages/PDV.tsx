import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PDV = () => {
  const { empresaId } = useAuth();
  const [cardapio, setCardapio] = useState<any[]>([]);
  const [carrinho, setCarrinho] = useState<Record<number, { item: any; qtd: number }>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "PDV · Vendas Pro"; }, []);

  useEffect(() => {
    if (!empresaId) return;
    supabase.from("Cardapio").select("*").eq("id_empresa", empresaId).order("Nome")
      .then(({ data }) => setCardapio(data ?? []));
  }, [empresaId]);

  const add = (item: any) => {
    setCarrinho((c) => ({ ...c, [item.id]: { item, qtd: (c[item.id]?.qtd ?? 0) + 1 } }));
  };
  const dec = (id: number) => {
    setCarrinho((c) => {
      const cur = c[id];
      if (!cur) return c;
      if (cur.qtd <= 1) { const { [id]: _, ...rest } = c; return rest; }
      return { ...c, [id]: { ...cur, qtd: cur.qtd - 1 } };
    });
  };
  const clear = () => setCarrinho({});

  const total = Object.values(carrinho).reduce((s, x) => s + (x.item.Valor ?? 0) * x.qtd, 0);
  const itensCount = Object.values(carrinho).reduce((s, x) => s + x.qtd, 0);

  const finalizar = async () => {
    if (!empresaId || itensCount === 0) return;
    setBusy(true);
    try {
      const { data: venda, error: vErr } = await supabase
        .from("Venda").insert({ id_empresa: empresaId }).select().single();
      if (vErr) throw vErr;

      const pedidos: any[] = [];
      Object.values(carrinho).forEach(({ item, qtd }) => {
        for (let i = 0; i < qtd; i++) {
          pedidos.push({ id_venda: venda.id, id_cardapio: item.id, id_empresa: empresaId });
        }
      });
      const { error: pErr } = await supabase.from("Pedido").insert(pedidos);
      if (pErr) throw pErr;

      // baixa de estoque (best-effort)
      for (const { item, qtd } of Object.values(carrinho)) {
        const { data: pc } = await supabase.from("ProduxCard").select("id_produto").eq("id_cardapio", item.id);
        const prodIds = (pc ?? []).map((x: any) => x.id_produto).filter(Boolean);
        if (prodIds.length === 0) continue;
        const { data: pm } = await supabase.from("ProduxMateria").select("id_materia, quantidade").in("id_produto", prodIds);
        for (const r of pm ?? []) {
          const consumo = (r.quantidade ?? 0) * qtd;
          const { data: est } = await supabase.from("Estoque").select("*").eq("id_materia", r.id_materia).order("id", { ascending: false }).limit(1).maybeSingle();
          if (est) {
            await supabase.from("Estoque").update({ quantidade: (est.quantidade ?? 0) - consumo }).eq("id", est.id);
          } else {
            await supabase.from("Estoque").insert({ id_materia: r.id_materia, quantidade: -consumo });
          }
        }
      }

      toast.success(`Venda #${venda.id} registrada (${fmt(total)})`);
      clear();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao registrar venda");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr,360px] gap-6 max-w-7xl mx-auto">
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-semibold">PDV</h1>
          <p className="text-muted-foreground">Toque para adicionar ao pedido</p>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cardapio.map((c) => (
            <button
              key={c.id}
              onClick={() => add(c)}
              className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-elegant transition-all"
            >
              <div className="font-medium">{c.Nome}</div>
              <div className="text-primary text-sm mt-1">{fmt(c.Valor ?? 0)}</div>
            </button>
          ))}
          {cardapio.length === 0 && (
            <Card className="col-span-full p-6 text-center text-muted-foreground">
              Cadastre itens no Cardápio para começar a vender.
            </Card>
          )}
        </div>
      </div>

      <Card className="p-4 h-fit lg:sticky lg:top-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Pedido atual</h2>
          {itensCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{itensCount} item(s)</span>}
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {Object.values(carrinho).map(({ item, qtd }) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
              <div className="flex-1">
                <div className="text-sm font-medium">{item.Nome}</div>
                <div className="text-xs text-muted-foreground">{fmt(item.Valor ?? 0)}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => dec(item.id)}><Minus className="h-3 w-3" /></Button>
              <span className="w-6 text-center text-sm">{qtd}</span>
              <Button size="icon" variant="ghost" onClick={() => add(item)}><Plus className="h-3 w-3" /></Button>
            </div>
          ))}
          {itensCount === 0 && <p className="text-sm text-muted-foreground text-center py-6">Carrinho vazio</p>}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="text-2xl font-semibold text-primary">{fmt(total)}</span>
        </div>
        <div className="mt-4 grid grid-cols-[1fr,auto] gap-2">
          <Button disabled={itensCount === 0 || busy} onClick={finalizar}>
            {busy ? "Processando..." : "Finalizar venda"}
          </Button>
          <Button variant="ghost" disabled={itensCount === 0 || busy} onClick={clear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PDV;
