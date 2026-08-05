import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Mitigação de SSRF (achado em revisão de segurança pré-go-live, E10-05) —
 * qualquer código que faça `fetch()` server-side de uma URL fornecida por
 * usuário (ex.: `WatermarkService` baixando `ProjectCatalog.arquivos` pra
 * aplicar marca d'água) precisa checar isto antes. Sem essa checagem, um
 * PRESTADOR malicioso poderia listar `http://169.254.169.254/...` (endpoint
 * de metadata de nuvem) ou `http://localhost:6379` (Redis interno) como
 * "arquivo" do projeto — o servidor faria a requisição por ele.
 *
 * Resolve o hostname via DNS antes de decidir (não basta olhar a string:
 * um domínio comum pode apontar pra um IP interno — "DNS rebinding").
 * Sempre rejeita: protocolo != http(s), IPv4 privado/loopback/link-local/
 * reservado, IPv6 loopback/link-local/unique-local.
 */
export class UnsafeUrlError extends Error {}

const IPV4_BLOCKED_RANGES: [number, number][] = [
  [ipv4ToInt("0.0.0.0"), ipv4ToInt("0.255.255.255")], // "this" network
  [ipv4ToInt("10.0.0.0"), ipv4ToInt("10.255.255.255")], // RFC1918
  [ipv4ToInt("100.64.0.0"), ipv4ToInt("100.127.255.255")], // CGNAT
  [ipv4ToInt("127.0.0.0"), ipv4ToInt("127.255.255.255")], // loopback
  [ipv4ToInt("169.254.0.0"), ipv4ToInt("169.254.255.255")], // link-local (cloud metadata)
  [ipv4ToInt("172.16.0.0"), ipv4ToInt("172.31.255.255")], // RFC1918
  [ipv4ToInt("192.0.0.0"), ipv4ToInt("192.0.0.255")], // IETF protocol assignments
  [ipv4ToInt("192.168.0.0"), ipv4ToInt("192.168.255.255")], // RFC1918
  [ipv4ToInt("198.18.0.0"), ipv4ToInt("198.19.255.255")], // benchmark
  [ipv4ToInt("224.0.0.0"), ipv4ToInt("255.255.255.255")], // multicast/reserved
];

function ipv4ToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function isBlockedIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return IPV4_BLOCKED_RANGES.some(([start, end]) => value >= start && value <= end);
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" || // loopback
    normalized === "::" ||
    normalized.startsWith("fe80:") || // link-local
    normalized.startsWith("fc") || // unique local
    normalized.startsWith("fd") || // unique local
    normalized.startsWith("::ffff:") // IPv4-mapped — valida a parte IPv4 separadamente
  );
}

/** Lança `UnsafeUrlError` se a URL não for segura pra buscar server-side. */
export async function assertSafeExternalUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError(`URL inválida: ${rawUrl}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError(`Protocolo não permitido: ${url.protocol}`);
  }

  const hostname = url.hostname;
  if (hostname === "localhost") {
    throw new UnsafeUrlError("Host não permitido: localhost");
  }

  const literalIpVersion = isIP(hostname);
  const addresses: string[] = [];

  if (literalIpVersion === 4 || literalIpVersion === 6) {
    addresses.push(hostname);
  } else {
    try {
      const resolved = await lookup(hostname, { all: true });
      addresses.push(...resolved.map((r) => r.address));
    } catch {
      throw new UnsafeUrlError(`Não foi possível resolver o host: ${hostname}`);
    }
  }

  for (const address of addresses) {
    const version = isIP(address);
    if (version === 4 && isBlockedIpv4(address)) {
      throw new UnsafeUrlError(`Endereço bloqueado (rede privada/reservada): ${address}`);
    }
    if (version === 6 && isBlockedIpv6(address)) {
      throw new UnsafeUrlError(`Endereço bloqueado (rede privada/reservada): ${address}`);
    }
  }
}
