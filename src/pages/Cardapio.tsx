import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Cardapio = () => {
  const { empresaId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [vincs, setVincs] = useState<Record<number, any[]>>({});
  const [open, setOpen] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [novoProd, setNovoProd] = useState("");

  useEffect(() => { document.title = "Cardápio · Vendas Pro"; }, []);

  const load = async () => {
    if (!empresaId) return;
    const { data: c } = await supabase.from("Cardapio").select("*").eq("id_empresa", empresaId).order("id", { ascending: false });
    setItems(c ?? []);
    const { data: p } = await supabase.from("Produtos").select("*").eq("id_empresa", empresaId);
    setProdutos(p ?? []);
    const { data: pc } = await supabase.from("ProduxCard").select("*, Produtos:id_produto(Nome)").eq("id_empresa", empresaId);
    const map: Record<number, any[]> = {};
    (pc ?? []).forEach((r: any) => {
      if (!r.id_cardapio) return;
      map[r.id_cardapio] ??= [];
      map[r.id_cardapio].push(r);
    });
    setVincs(map);
  };
  useEffect(() => { load(); }, [empresaId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return;
    const { error } = await supabase.from("Cardapio").insert({ Nome: nome, Valor: parseFloat(valor), id_empresa: empresaId });
    if (error) return toast.error(error.message);
    setNome(""); setValor("");
    toast.success("Item adicionado ao cardápio");
    load();
  };

  const remove = async (id: number) => {
    await supabase.from("ProduxCard").delete().eq("id_cardapio", id);
    const { error } = await supabase.from("Cardapio").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addProd = async (idCard: number) => {
    if (!novoProd || !empresaId) return;
    const { error } = await supabase.from("ProduxCard").insert({
      id_cardapio: idCard, id_produto: parseInt(novoProd), id_empresa: empresaId,
    });
    if (error) return toast.error(error.message);
    setNovoProd("");
    load();
  };

  const removeProd = async (id: number) => {
    await supabase.from("ProduxCard").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold">Cardápio</h1>
        <p className="text-muted-foreground">Itens vendáveis (combinações de produtos)</p>
      </header>

      <Card className="p-5">
        <form onSubmit={add} className="grid md:grid-cols-3 gap-3 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome do item</Label>
            <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <Button type="submit" className="md:col-span-3"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {items.map((c) => {
          const isOpen = open === c.id;
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{c.Nome}</div>
                  <div className="text-sm text-primary">{fmt(c.Valor ?? 0)}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setOpen(isOpen ? null : c.id)}>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {isOpen && (
                <div className="border-t border-border p-4 space-y-3 bg-muted/20">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Produtos vinculados</div>
                  {(vincs[c.id] ?? []).map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span>{v.Produtos?.Nome}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeProd(v.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Select value={novoProd} onValueChange={setNovoProd}>
                      <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
                      <SelectContent>
                        {produtos.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.Nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addProd(c.id)}>Vincular</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {items.length === 0 && <Card className="p-6 text-center text-muted-foreground">Nenhum item no cardápio.</Card>}
      </div>
    </div>
  );
};

export default Cardapio;
