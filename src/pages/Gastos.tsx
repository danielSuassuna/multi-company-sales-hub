import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const Gastos = () => {
  const { empresaId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [materias, setMaterias] = useState<any[]>([]);

  const [valor, setValor] = useState("");
  const [idCat, setIdCat] = useState("");
  const [idMat, setIdMat] = useState("");

  useEffect(() => { document.title = "Gastos · Vendas Pro"; }, []);

  const load = async () => {
    if (!empresaId) return;
    const { data } = await supabase.from("Gastos")
      .select("*, Categoria:id_categoria(Nome), MateriaPrima:id_materia(nome)")
      .eq("id_empresa", empresaId).order("created_at", { ascending: false });
    setItems(data ?? []);
    const { data: c } = await supabase.from("Categoria").select("*").eq("id_empresa", empresaId);
    setCategorias(c ?? []);
    const { data: m } = await supabase.from("MateriaPrima").select("*").eq("id_empresa", empresaId);
    setMaterias(m ?? []);
  };
  useEffect(() => { load(); }, [empresaId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId || !idCat || !valor) return;
    const { error } = await supabase.from("Gastos").insert({
      id_empresa: empresaId,
      id_categoria: parseInt(idCat),
      Valor: parseFloat(valor),
      id_materia: idMat ? parseInt(idMat) : null,
    });
    if (error) return toast.error(error.message);
    setValor(""); setIdMat("");
    toast.success("Gasto registrado");
    load();
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from("Gastos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const total = items.reduce((s, g) => s + (g.Valor ?? 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gastos</h1>
          <p className="text-muted-foreground">Despesas operacionais</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-muted-foreground tracking-wider">Total</div>
          <div className="text-2xl font-semibold text-destructive">{fmt(total)}</div>
        </div>
      </header>

      <Card className="p-5">
        <form onSubmit={add} className="grid md:grid-cols-4 gap-3 items-end">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={idCat} onValueChange={setIdCat}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categorias.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.Nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Matéria-prima (opcional)</Label>
            <Select value={idMat} onValueChange={setIdMat}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {materias.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Data</th>
              <th className="text-left px-4 py-2">Categoria</th>
              <th className="text-left px-4 py-2">Matéria-prima</th>
              <th className="text-right px-4 py-2">Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g.id} className="border-t border-border">
                <td className="px-4 py-2">{fmtDate(g.created_at)}</td>
                <td className="px-4 py-2">{g.Categoria?.Nome ?? "—"}</td>
                <td className="px-4 py-2">{g.MateriaPrima?.nome ?? "—"}</td>
                <td className="px-4 py-2 text-right text-destructive font-medium">{fmt(g.Valor)}</td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(g.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum gasto.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Gastos;
