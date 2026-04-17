import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const Estoque = () => {
  const { empresaId } = useAuth();
  const [materias, setMaterias] = useState<any[]>([]);
  const [saldos, setSaldos] = useState<Record<number, number>>({});
  const [idMateria, setIdMateria] = useState("");
  const [qtd, setQtd] = useState("");

  useEffect(() => { document.title = "Estoque · Vendas Pro"; }, []);

  const load = async () => {
    if (!empresaId) return;
    const { data: m } = await supabase.from("MateriaPrima").select("*").eq("id_empresa", empresaId).order("nome");
    setMaterias(m ?? []);
    const ids = (m ?? []).map((x: any) => x.id);
    if (ids.length === 0) { setSaldos({}); return; }
    const { data: e } = await supabase.from("Estoque").select("*").in("id_materia", ids);
    const sums: Record<number, number> = {};
    (e ?? []).forEach((r: any) => { sums[r.id_materia] = (sums[r.id_materia] ?? 0) + (r.quantidade ?? 0); });
    setSaldos(sums);
  };
  useEffect(() => { load(); }, [empresaId]);

  const lancar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMateria || !qtd) return;
    const { error } = await supabase.from("Estoque").insert({
      id_materia: parseInt(idMateria), quantidade: parseInt(qtd),
    });
    if (error) return toast.error(error.message);
    setQtd("");
    toast.success("Movimentação registrada");
    load();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold">Estoque</h1>
        <p className="text-muted-foreground">Saldo de matérias-primas (use valores negativos para baixa manual)</p>
      </header>

      <Card className="p-5">
        <form onSubmit={lancar} className="grid md:grid-cols-[2fr,1fr,auto] gap-3 items-end">
          <div className="space-y-2">
            <Label>Matéria-prima</Label>
            <Select value={idMateria} onValueChange={setIdMateria}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {materias.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input type="number" required value={qtd} onChange={(e) => setQtd(e.target.value)} />
          </div>
          <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Lançar</Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Matéria-prima</th>
              <th className="text-right px-4 py-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {materias.map((m) => {
              const s = saldos[m.id] ?? 0;
              return (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-2">{m.nome}</td>
                  <td className={`px-4 py-2 text-right font-medium ${s < 0 ? "text-destructive" : s === 0 ? "text-muted-foreground" : "text-success"}`}>
                    {s}
                  </td>
                </tr>
              );
            })}
            {materias.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">Sem matérias-primas.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Estoque;
