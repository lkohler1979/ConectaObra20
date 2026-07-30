/**
 * Seed mínimo para desenvolvimento local (S0-05). Cobre as 5 personas
 * principais pra testar o sistema ponta a ponta: admin (mediador de
 * disputas, E4-09 — P-048), cliente, prestador, engenheiro (TECNICO,
 * reaproveita ProfilePrestador — P-015) e fornecedor.
 * Dados fictícios — CPF/CNPJ abaixo não são reais.
 * Senha de todos os usuários: "senha12345" — só para dev local.
 * Rodar com: pnpm --filter @conectaobra/api seed
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const SEED_SENHA_HASH = hashSync("senha12345", 10);

async function main() {
  const cliente = await prisma.user.upsert({
    where: { email: "ana.cliente@example.com" },
    update: {},
    create: {
      tipo: "CLIENTE_PF",
      nome: "Ana Cliente",
      email: "ana.cliente@example.com",
      telefone: "+5527999990001",
      cpfCnpj: "00000000191",
      senhaHash: SEED_SENHA_HASH,
      telefoneVerificado: true,
      kycStatus: "APROVADO",
    },
  });

  const prestador = await prisma.user.upsert({
    where: { email: "carlos.prestador@example.com" },
    update: {},
    create: {
      tipo: "PRESTADOR",
      nome: "Carlos Prestador",
      email: "carlos.prestador@example.com",
      telefone: "+5527999990002",
      cpfCnpj: "00000000272",
      senhaHash: SEED_SENHA_HASH,
      telefoneVerificado: true,
      kycStatus: "APROVADO",
      profilePrestador: {
        create: {
          categorias: ["eletrica", "hidraulica"],
          experienciaAnos: 8,
          certificados: [],
          raioAtendimentoKm: 30,
          selo: "verificado",
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@conectaobra.example.com" },
    update: {},
    create: {
      tipo: "ADMIN",
      nome: "Admin ConectaObra",
      email: "admin@conectaobra.example.com",
      telefone: "+5527999990099",
      cpfCnpj: "00000000363",
      senhaHash: SEED_SENHA_HASH,
      telefoneVerificado: true,
      kycStatus: "APROVADO",
    },
  });

  // TECNICO reaproveita ProfilePrestador (doc 02 §3 não define profile próprio pra técnico — ver P-015).
  const engenheiro = await prisma.user.upsert({
    where: { email: "julia.engenheira@example.com" },
    update: {},
    create: {
      tipo: "TECNICO",
      nome: "Júlia Engenheira",
      email: "julia.engenheira@example.com",
      telefone: "+5527999990098",
      cpfCnpj: "00000000444",
      senhaHash: SEED_SENHA_HASH,
      telefoneVerificado: true,
      kycStatus: "APROVADO",
      profilePrestador: {
        create: {
          categorias: ["estrutural", "projetos"],
          experienciaAnos: 12,
          certificados: ["CREA-ES 123456"],
          raioAtendimentoKm: 50,
          selo: "verificado",
        },
      },
    },
  });

  const fornecedor = await prisma.user.upsert({
    where: { email: "contato@materiaisvitoria.example.com" },
    update: {},
    create: {
      tipo: "FORNECEDOR",
      nome: "Materiais Vitória Ltda",
      email: "contato@materiaisvitoria.example.com",
      cpfCnpj: "00000000000191",
      senhaHash: SEED_SENHA_HASH,
      telefoneVerificado: true,
      kycStatus: "APROVADO",
      profileFornecedor: {
        create: {
          razaoSocial: "Materiais Vitória Comércio Ltda",
          categorias: ["cimento", "acabamento"],
          regioes: ["Vitória/ES", "Vila Velha/ES"],
          certificacoes: [],
          plano: "free",
          products: {
            create: [
              {
                nome: "Cimento CP II 50kg",
                categoria: "cimento",
                precoCentavos: 3490,
                unidade: "saco",
                estoque: 500,
                fotos: [],
              },
            ],
          },
        },
      },
    },
  });

  const obra = await prisma.work.create({
    data: {
      clienteId: cliente.id,
      titulo: "Reforma de banheiro",
      tipo: "REFORMA",
      endereco: "Rua Exemplo, 123 — Vitória/ES",
      areaM2: 12.5,
      orcamentoPrevistoCentavos: 800000,
      status: "planejamento",
    },
  });

  const rfq = await prisma.rfq.create({
    data: {
      obraId: obra.id,
      clienteId: cliente.id,
      categoria: "eletrica",
      descricao: "Troca completa do quadro elétrico e pontos de luz do banheiro.",
      regiao: "Vitória/ES",
      status: "ABERTO",
    },
  });

  await prisma.rfqProposal.create({
    data: {
      rfqId: rfq.id,
      proponenteId: prestador.id,
      precoCentavos: 120000,
      prazoDias: 5,
      observacoes: "Inclui material elétrico básico, exclui luminárias.",
      status: "ENVIADA",
    },
  });

  console.log("Seed concluído:", {
    admin: admin.email,
    cliente: cliente.email,
    prestador: prestador.email,
    engenheiro: engenheiro.email,
    fornecedor: fornecedor.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
