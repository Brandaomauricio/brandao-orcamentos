"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppShell } from "@/components/AppShell";

type Tutorial = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  note?: string;
  href: string;
  actionLabel: string;
};

const tutorials: Tutorial[] = [
  {
    id: "clientes",
    title: "Como cadastrar cliente",
    description: "Cadastre os dados principais do cliente para usar depois em orcamentos e compromissos.",
    steps: [
      "Acesse Clientes.",
      "Clique em Novo Cliente.",
      "Preencha nome, WhatsApp e endereco.",
      "Clique em Salvar Cliente.",
      "Depois use esse cliente em Novo Orcamento.",
    ],
    href: "/clientes",
    actionLabel: "Ir para Clientes",
  },
  {
    id: "novo-orcamento",
    title: "Como criar orcamento",
    description: "Monte uma proposta escolhendo o cliente, os servicos e as condicoes antes de salvar.",
    steps: [
      "Acesse Novo Orcamento.",
      "Escolha ou cadastre o cliente.",
      "Adicione servicos, quantidades e valores.",
      "Revise o total e as condicoes comerciais.",
      "Clique em Salvar Orcamento.",
    ],
    href: "/orcamentos/novo",
    actionLabel: "Ir para Novo Orcamento",
  },
  {
    id: "pdf",
    title: "Como gerar PDF",
    description: "Abra um orcamento salvo e use a proposta para imprimir ou salvar em PDF.",
    steps: [
      "Acesse Orcamentos.",
      "Abra o orcamento desejado.",
      "Entre na proposta do orcamento.",
      "Use a opcao de imprimir do navegador.",
      "Escolha Salvar em PDF.",
    ],
    href: "/orcamentos",
    actionLabel: "Ir para Orcamentos",
  },
  {
    id: "agenda",
    title: "Como usar agenda",
    description: "Organize visitas, medicoes e instalacoes criando compromissos vinculados ao seu trabalho.",
    steps: [
      "Acesse Agenda.",
      "Clique para criar um novo compromisso.",
      "Informe titulo, data e horario.",
      "Vincule cliente ou orcamento, se fizer sentido.",
      "Salve para acompanhar pela agenda.",
    ],
    href: "/agenda",
    actionLabel: "Ir para Agenda",
  },
  {
    id: "minha-conta",
    title: "Como configurar Minha Conta",
    description: "Complete seus dados profissionais para deixar as propostas com a identidade da empresa.",
    steps: [
      "Acesse Minha Conta.",
      "Preencha os dados profissionais.",
      "Adicione informacoes de contato e endereco.",
      "Configure padroes que aparecem nas propostas.",
      "Salve as alteracoes.",
    ],
    href: "/minha-conta",
    actionLabel: "Ir para Minha Conta",
  },
  {
    id: "meus-servicos",
    title: "Como cadastrar meus servicos",
    description: "Crie uma lista de servicos padrao para reutilizar nos proximos orcamentos.",
    steps: [
      "Acesse Ferramentas.",
      "Entre em Meus Servicos.",
      "Cadastre nome, unidade, preco e descricao.",
      "Salve o servico.",
      "Use o servico ao montar um novo orcamento.",
    ],
    href: "/ferramentas/meus-servicos",
    actionLabel: "Ir para Meus Servicos",
  },
  {
    id: "calculadora-profissional",
    title: "Como usar a Calculadora Profissional",
    description: "A Calculadora Profissional ajuda você a descobrir quanto precisa cobrar em uma obra antes de montar a proposta. A Base da diária mostra o mínimo que você precisa gerar por dia, enquanto os Dados da obra somam apenas os custos específicos daquele serviço.",
    steps: [
      "Preencha quanto você quer tirar por mês, seus custos fixos mensais da profissão e quantos dias costuma trabalhar.",
      "Use custos fixos mensais para despesas da profissão, como ferramentas, manutenção, telefone, internet, app, contador, EPI e divulgação.",
      "Informe os dados da obra: metragem, dias estimados, ajudante, deslocamento desta obra e outros custos específicos desse serviço.",
      "Não repita combustível ou outro custo nos dois campos: o que é mensal entra na Base da diária; o que é causado por esta obra entra em Dados da obra.",
      "Ajuste as margens de dificuldade, lucro e negociação.",
      "Confira o preço mínimo, o preço recomendado e o valor por m².",
      'Clique em "Usar esse valor no orçamento" para levar o valor calculado para a proposta.',
      "No orçamento, revise o serviço carregado antes de salvar ou enviar ao cliente.",
    ],
    note: "Essa calculadora não substitui sua análise profissional da obra. Ela serve como apoio para evitar orçamento no achismo e ajudar o instalador a não trabalhar no prejuízo.",
    href: "/calculadora-profissional",
    actionLabel: "Ir para Calculadora",
  },
  {
    id: "condicoes-comerciais",
    title: "Como usar condicoes comerciais",
    description: "Defina textos e regras comerciais para agilizar a apresentacao das propostas.",
    steps: [
      "Acesse Ferramentas.",
      "Entre em Condicoes Comerciais.",
      "Crie ou ajuste um modelo de condicao.",
      "Salve o modelo.",
      "Aplique ou adapte o texto em cada orcamento.",
    ],
    href: "/ferramentas/condicoes-comerciais",
    actionLabel: "Ir para Condicoes Comerciais",
  },
  {
    id: "compartilhar-proposta",
    title: "Como compartilhar proposta",
    description: "Compartilhe a proposta com o cliente a partir de um orcamento salvo.",
    steps: [
      "Acesse Orcamentos.",
      "Abra o orcamento que deseja enviar.",
      "Confira os dados da proposta.",
      "Use o link publico ou a opcao de compartilhamento disponivel.",
      "Envie o link para o cliente pelo canal desejado.",
    ],
    href: "/orcamentos",
    actionLabel: "Ir para Orcamentos",
  },
];

export default function TutorialPage() {
  const [selectedTutorial, setSelectedTutorial] = useState(tutorials[0].id);

  return (
    <AppShell>
      <AppHeader title="Tutorial e dicas" subtitle="Aprenda a usar o app e melhore a apresentacao dos seus orcamentos." />

      <section className="grid grid-cols-1 gap-3 px-5">
        {tutorials.map((tutorial) => {
          const isSelected = selectedTutorial === tutorial.id;

          return (
            <div key={tutorial.id} className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setSelectedTutorial(tutorial.id)}
                aria-expanded={isSelected}
                className={`card block w-full p-4 text-left transition ${isSelected ? "border-2 border-warning" : ""}`}
              >
                <h3 className="text-base font-black text-graphite">{tutorial.title}</h3>
                <p className="mt-1 text-sm leading-5 text-cement">Abrir orientacao rapida.</p>
              </button>

              {isSelected ? (
                <div className="card p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-wood">Guia rapido</p>
                  <h2 className="mt-2 text-xl font-black text-graphite">{tutorial.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-cement">{tutorial.description}</p>
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-bold leading-5 text-graphite">
                    {tutorial.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  {tutorial.note ? <p className="mt-4 rounded-2xl bg-technical p-4 text-sm font-bold leading-6 text-cement">{tutorial.note}</p> : null}
                  <Link
                    href={tutorial.href}
                    className="mt-5 block rounded-2xl bg-warning px-5 py-4 text-center text-sm font-black text-graphite shadow-soft"
                  >
                    {tutorial.actionLabel}
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
