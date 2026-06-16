import type { CardSearchParams, PokeTCGCard, PokeTCGResponse, PokeTCGSetsResponse } from "@/types/pokemontcg";

const BASE = "https://api.pokemontcg.io/v2";
const CARD_FIELDS = "id,name,images,set,rarity,types,supertype,number,hp";

function getHeaders() {
  return {
    "X-Api-Key": process.env.POKEMONTCG_API_KEY ?? "",
  };
}

export async function searchCards(params: CardSearchParams): Promise<PokeTCGResponse> {
  const url = new URL(`${BASE}/cards`);

  const queryParts: string[] = [];
  if (params.query) queryParts.push(`name:${params.query}*`);
  if (params.setId) queryParts.push(`set.id:${params.setId}`);
  if (params.supertypes?.length) {
    if (params.supertypes.length === 1) {
      queryParts.push(`supertype:${params.supertypes[0]}`);
    } else {
      queryParts.push(`(${params.supertypes.map((s) => `supertype:${s}`).join(" OR ")})`);
    }
  }
  if (params.types?.length) queryParts.push(`types:${params.types[0]}`);

  if (queryParts.length) url.searchParams.set("q", queryParts.join(" "));
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("pageSize", String(params.pageSize ?? 20));
  url.searchParams.set("orderBy", params.orderBy ?? "name");
  url.searchParams.set("select", CARD_FIELDS);

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`PokéTCG API error: ${res.status}`);
  return res.json();
}

export async function getCardById(id: string): Promise<PokeTCGCard | null> {
  const res = await fetch(`${BASE}/cards/${id}`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`PokéTCG API error: ${res.status}`);
  const data = await res.json();
  return data.data;
}

export async function getSets(): Promise<PokeTCGSetsResponse> {
  const res = await fetch(`${BASE}/sets?orderBy=-releaseDate&select=id,name,series,printedTotal,total,releaseDate,images`, {
    headers: getHeaders(),
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`PokéTCG API error: ${res.status}`);
  return res.json();
}
