import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProjectPublic } from "@conectaobra/types/projects-catalog";
import { Alert, AlertDescription, Badge } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { ComprarButton } from "./comprar-button";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchProject(id: string): Promise<ProjectPublic | null> {
  const res = await apiFetchOrThrow(`/public/catalog/projects/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const project = await fetchProject(id);
    if (!project) {
      return { title: "Projeto não encontrado — ConectaObra" };
    }
    return {
      title: `${project.titulo} — Catálogo de plantas | ConectaObra`,
      description: project.descricao ?? `Projeto arquitetônico de ${project.arquitetoNome}.`,
    };
  } catch {
    return { title: "ConectaObra" };
  }
}

export default async function CatalogoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project: ProjectPublic | null;
  try {
    project = await fetchProject(id);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar este projeto agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <Link href="/catalogo" className="text-sm font-semibold text-grafite hover:text-laranja">
        ← Catálogo de plantas
      </Link>

      {project.imagemCapaUrl && (
        <div className="relative h-56 w-full overflow-hidden rounded-lg">
          <Image
            src={project.imagemCapaUrl}
            alt={project.titulo}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-grafite">{project.titulo}</h1>
          <Badge>{project.categoria}</Badge>
        </div>
        <p className="mt-1 text-sm text-[#7A828C]">
          Por {project.arquitetoNome} · {project.vendasCount} venda
          {project.vendasCount === 1 ? "" : "s"}
        </p>
        {project.licenca && (
          <p className="mt-1 text-xs text-[#7A828C]">Licença: {project.licenca}</p>
        )}
      </div>

      {project.descricao && <p className="text-sm text-grafite/80">{project.descricao}</p>}

      <div className="flex items-center justify-between rounded-lg border-[1.5px] border-concreto bg-white px-4 py-3">
        <span className="text-xl font-black text-laranja">
          {formatMoney(project.precoCentavos)}
        </span>
        <ComprarButton projectId={project.id} />
      </div>
    </main>
  );
}
