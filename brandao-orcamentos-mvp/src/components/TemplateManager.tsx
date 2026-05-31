"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type Template = {
  id: string;
  user_id: string | null;
  title: string;
  category: string | null;
  type: string | null;
  content: string;
  is_default: boolean | null;
};

type TemplateManagerProps = {
  category: string;
  titlePlaceholder?: string;
  contentPlaceholder?: string;
  defaultItems: Array<{ title: string; content: string }>;
  applyLabel?: string;
  applyStorageKey?: string;
};

export function TemplateManager({
  category,
  titlePlaceholder = "Título do modelo",
  contentPlaceholder = "Texto do modelo",
  defaultItems,
  applyLabel,
  applyStorageKey,
}: TemplateManagerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadTemplates = useCallback(async (currentUser: User | null) => {
    setIsLoading(true);
    const baseTemplates = defaultItems.map((item, index) => ({
      id: `default-${category}-${index}`,
      user_id: null,
      title: item.title,
      category,
      type: category,
      content: item.content,
      is_default: true,
    }));

    if (!isSupabaseConfigured || !currentUser) {
      setTemplates(baseTemplates);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("templates")
      .select("id,user_id,title,category,type,content,is_default")
      .or(`user_id.eq.${currentUser.id},user_id.is.null,is_default.eq.true`)
      .in("category", [category])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar modelos:", error);
      setMessage("Não foi possível carregar seus modelos agora.");
      setTemplates(baseTemplates);
    } else {
      setTemplates([...baseTemplates, ...((data ?? []) as Template[])]);
    }
    setIsLoading(false);
  }, [category, defaultItems]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadTemplates(null);
      return;
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error("Erro ao verificar usuário nos modelos:", error);
      }
      setUser(data.user);
      loadTemplates(data.user);
    });
  }, [loadTemplates]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Texto copiado.");
    } catch (error) {
      console.error("Erro ao copiar texto:", error);
      setMessage("Não foi possível copiar automaticamente. Selecione e copie o texto manualmente.");
    }
  }

  function applyText(text: string) {
    if (!applyStorageKey) {
      setMessage("Aplicação direta em desenvolvimento. Use o botão copiar por enquanto.");
      return;
    }
    window.localStorage.setItem(applyStorageKey, text);
    setMessage("Texto separado para usar no próximo orçamento.");
  }

  async function saveTemplate() {
    if (!user) {
      setMessage("Entre na sua conta para salvar modelos personalizados.");
      return;
    }
    if (!form.title.trim() || !form.content.trim()) {
      setMessage("Informe título e texto do modelo.");
      return;
    }

    setIsSaving(true);
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      category,
      type: category,
      content: form.content.trim(),
      is_default: false,
      updated_at: new Date().toISOString(),
    };

    const query = editingId
      ? supabase.from("templates").update(payload).eq("id", editingId).eq("user_id", user.id)
      : supabase.from("templates").insert(payload);
    const { error } = await query;

    if (error) {
      console.error("Erro ao salvar modelo:", error);
      setMessage("Não foi possível salvar o modelo agora.");
    } else {
      setForm({ title: "", content: "" });
      setEditingId("");
      setMessage(editingId ? "Modelo atualizado." : "Modelo salvo.");
      await loadTemplates(user);
    }
    setIsSaving(false);
  }

  async function deleteTemplate(template: Template) {
    if (!user || !template.user_id) {
      setMessage("Modelos padrão não podem ser excluídos.");
      return;
    }
    if (!window.confirm("Excluir este modelo?")) return;

    setDeletingId(template.id);
    const { error } = await supabase.from("templates").delete().eq("id", template.id).eq("user_id", user.id);
    if (error) {
      console.error("Erro ao excluir modelo:", error);
      setMessage("Não foi possível excluir o modelo agora.");
    } else {
      setMessage("Modelo excluído.");
      await loadTemplates(user);
    }
    setDeletingId("");
  }

  function editTemplate(template: Template) {
    if (!template.user_id) {
      setMessage("Modelos padrão podem ser copiados, mas não editados.");
      return;
    }
    setEditingId(template.id);
    setForm({ title: template.title, content: template.content });
    setMessage("Edite o modelo e salve as alterações.");
  }

  return (
    <section className="space-y-4 px-5">
      <div className="card p-4">
        <h2 className="text-lg font-black text-graphite">{editingId ? "Editar modelo" : "Novo modelo personalizado"}</h2>
        <div className="mt-4 space-y-3">
          <input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={titlePlaceholder} />
          <textarea className="input min-h-28 resize-none" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder={contentPlaceholder} />
        </div>
        <button type="button" disabled={isSaving} onClick={saveTemplate} className="mt-4 block w-full rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft disabled:opacity-60">
          {isSaving ? "Salvando..." : editingId ? "Atualizar modelo" : "Salvar modelo"}
        </button>
      </div>

      {message ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-wood shadow-sm">{message}</div> : null}
      {isLoading ? <div className="rounded-2xl bg-white p-4 text-sm font-black text-cement shadow-sm">Carregando modelos...</div> : null}

      {templates.map((template) => (
        <div key={template.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-graphite">{template.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm font-bold leading-5 text-cement">{template.content}</p>
            </div>
            <span className="shrink-0 rounded-full bg-technical px-3 py-1 text-[11px] font-black text-cement">{template.user_id ? "meu" : "padrão"}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-black">
            <button type="button" onClick={() => copyText(template.content)} className="rounded-xl bg-warning py-2 text-graphite">Copiar</button>
            <button type="button" onClick={() => applyText(template.content)} className="rounded-xl bg-technical py-2 text-graphite">{applyLabel || "Aplicar"}</button>
            <button type="button" onClick={() => editTemplate(template)} className="rounded-xl bg-technical py-2 text-graphite">Editar</button>
            <button type="button" disabled={deletingId === template.id} onClick={() => deleteTemplate(template)} className="rounded-xl bg-technical py-2 text-graphite disabled:opacity-60">{deletingId === template.id ? "Excluindo..." : "Excluir"}</button>
          </div>
        </div>
      ))}
    </section>
  );
}
