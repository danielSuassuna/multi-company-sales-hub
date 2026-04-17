import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Estoque = () => {
  const { empresaId } = useAuth();
  const [materias, setMaterias] = useState<any[]>([]);
  const [uniques, setUniques] = useState<any[]>([]);
  const [saldosMat, setSaldosMat] = useState<Record<number, number>>({});
  const [saldosProd, setSaldosProd] = useState<Record<number, number>>({});

  useEffect(() => { document.title = "Estoque · Vendas Pro"; }, []);

  const load = async () => {
    if (!empresaId) return;
    
    // 1. Get stock balances (single row per item)
    const { data: e } = await supabase.from("Estoque").select("*").eq("id_empresa", empresaId);
    const sm: Record<number, number> = {};
    const sp: Record<number, number> = {};
    
    // Even if there are multiple rows (during migration), this will eventually point to the single row value
    (e ?? []).forEach((r: any) => {
      if (r.id_materia) sm[r.id_materia] = (sm[r.id_materia] ?? 0) + (r.quantidade ?? 0);
      if (r.id_produto) sp[r.id_produto] = (sp[r.id_produto] ?? 0) + (r.quantidade ?? 0);
    });

    // 2. Get Materias Primas
    const { data: m } = await supabase.from("MateriaPrima").select("*").eq("id_empresa", empresaId).order("nome");
    setMaterias(m ?? []);

    // 3. Get Products and filter those that should be in inventory
    const { data: allProds } = await supabase.from("Produtos").select("*").eq("id_empresa", empresaId).order("Nome");
    const filteredUniques = (allProds ?? []).filter(p => p.is_unique || (sp[p.id] !== undefined && sp[p.id] !== 0));
    
    setSaldosMat(sm);
    setSaldosProd(sp);
    setUniques(filteredUniques);
  };
  useEffect(() => { load(); }, [empresaId]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-semibold">Estoque</h1>
        <p className="text-muted-foreground">Saldo atual de matérias-primas</p>
      </header>

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
              const s = saldosMat[m.id] ?? 0;
              return (
                <tr key={"mat-"+m.id} className="border-t border-border">
                  <td className="px-4 py-2">{m.nome} <span className="text-[10px] text-muted-foreground ml-1 uppercase">(MP)</span></td>
                  <td className={`px-4 py-2 text-right font-medium ${s < 0 ? "text-destructive" : s === 0 ? "text-muted-foreground" : "text-success"}`}>
                    {s}
                  </td>
                </tr>
              );
            })}
            {uniques.map((p) => {
              const s = saldosProd[p.id] ?? 0;
              return (
                <tr key={"prod-"+p.id} className="border-t border-border">
                  <td className="px-4 py-2">{p.Nome} <span className="text-[10px] text-primary/70 ml-1 uppercase">(Revenda)</span></td>
                  <td className={`px-4 py-2 text-right font-medium ${s < 0 ? "text-destructive" : s === 0 ? "text-muted-foreground" : "text-success"}`}>
                    {s}
                  </td>
                </tr>
              );
            })}
            {materias.length === 0 && uniques.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">Vazio.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Estoque;
