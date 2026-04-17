import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MateriaPrima = () => {
  const { empresaId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [custo, setCusto] = useState("");
  const [fator, setFator] = useState("1");

  useEffect(() => { document.title = "Matéria-Prima · Vendas Pro"; }, []);

  const load = async () => {
    if (!empresaId) return;
    const { data } = await supabase.from("MateriaPrima").select("*").eq("id_empresa", empresaId).order("id", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [empresaId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return;
    const { error } = await supabase.from("MateriaPrima").insert({
      nome, Custo: parseFloat(custo), Fator: parseInt(fator), id_empresa: empresaId,
    });
    if (error) return toast.error(error.message);
    setNome(""); setCusto(""); setFator("1");
    toast.success("Matéria-prima cadastrada");
    load();
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from("MateriaPrima").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold">Matéria-Prima</h1>
        <p className="text-muted-foreground">Insumos com custo e fator de rendimento</p>
      </header>

      <Card className="p-5">
        <form onSubmit={add} className="grid md:grid-cols-4 gap-3 items-end">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Custo (R$)</Label>
            <Input type="number" step="0.01" required value={custo} onChange={(e) => setCusto(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fator (rendimento)</Label>
            <Input type="number" required value={fator} onChange={(e) => setFator(e.target.value)} />
          </div>
          <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-right px-4 py-2">Custo</th>
              <th className="text-right px-4 py-2">Fator</th>
              <th className="text-right px-4 py-2">Custo unitário</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-2">{m.nome}</td>
                <td className="px-4 py-2 text-right">{fmt(m.Custo)}</td>
                <td className="px-4 py-2 text-right">{m.Fator}</td>
                <td className="px-4 py-2 text-right text-primary">{fmt((m.Custo ?? 0) / Math.max(1, m.Fator ?? 1))}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhuma matéria-prima.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default MateriaPrima;
