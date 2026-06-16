export interface PokeTCGCardImages {
  small: string;
  large: string;
}

export interface PokeTCGSetImages {
  symbol: string;
  logo: string;
}

export interface PokeTCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  images: PokeTCGSetImages;
}

export interface PokeTCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  types?: string[];
  rarity?: string;
  images: PokeTCGCardImages;
  set: PokeTCGSet;
  number?: string;
  artist?: string;
  hp?: string;
}

export interface PokeTCGResponse {
  data: PokeTCGCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export interface PokeTCGSetsResponse {
  data: PokeTCGSet[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export interface CardSearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  setId?: string;
  types?: string[];
  supertypes?: string[];
}
