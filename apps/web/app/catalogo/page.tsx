import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ProjectCategory, ProjectPublic } from "@conectaobra/types/projects-catalog";
import { Alert, AlertDescription, Badge, Card, CardContent, CardTitle } from "@conectaobra/ui";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Catálogo de plantas — ConectaObra",
  description: "Projetos arquitetônicos prontos, publicados por arquitetos e engenheiros.",
};

const CATEGORIA_OPTIONS: { value: ProjectCategory; label: string }[] = [
  { value: "CASA", label: "Casa" },
  { value: "SOBRADO", label: "Sobrado" },
  { value: "GALPAO", label: "Galpão" },
  { value: "CHACARA", label: "Chácara" },
  { value: "CONDOMINIO", label: "Condomínio" },
];

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function fetchProjects(categoria?: string): Promise<ProjectPublic[]> {
  const params = new URLSearchParams({ limit: "30" });
  if (categoria) params.set("categoria", categoria);
  const res = await apiFetchOrThrow(`/public/catalog/projects?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;

  let projects: ProjectPublic[];
  try {
    projects = await fetchProjects(categoria);
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-areia px-5 py-10">
          <Alert variant="danger">
            <AlertDescription>
              Não foi possível carregar o catálogo agora — o serviço está indisponível. Tente
              novamente em instantes.
            </AlertDescription>
          </Alert>
        </main>
      );
    }
    throw err;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-areia px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← ConectaObra
        </Link>
        <Link href="/compras" className="text-sm font-semibold text-azul-planta">
          Minhas compras →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-grafite">Catálogo de plantas</h1>
        <p className="mt-1 text-sm text-grafite/80">
          Projetos arquitetônicos prontos, publicados por arquitetos e engenheiros.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="GET">
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          className="rounded-md border-[1.5px] border-concreto bg-white px-3 py-[9px] text-sm text-grafite"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-laranja px-4 py-[9px] text-sm font-bold text-white"
        >
          Filtrar
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="text-sm text-[#5B6875]">Nenhum projeto publicado ainda.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/catalogo/${project.id}`}>
              <Card className="h-full transition-colors hover:border-azul-planta">
                {project.imagemCapaUrl && (
                  <div className="relative h-36 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={project.imagemCapaUrl}
                      alt={project.titulo}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <CardContent className="flex flex-col gap-1 pt-4">
                  <div className="flex items-center gap-2">
                    <CardTitle>{project.titulo}</CardTitle>
                    <Badge>{project.categoria}</Badge>
                  </div>
                  <p className="text-xs text-[#7A828C]">{project.arquitetoNome}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-laranja">
                      {formatMoney(project.precoCentavos)}
                    </span>
                    <span className="text-xs text-[#7A828C]">
                      {project.vendasCount} venda{project.vendasCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
