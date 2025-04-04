import config from "../config";

export interface Manga {
    id: string;
    title: string;
    description: string;
    status: string;
    year: number;
    demographic: string;
    tags: string[];
    rating: string;
    lastChapter: string;
    coverUrl: string | null;
    author: string;
  }
  
  export interface MangaListResponse {
    data: Array<{
      id: string;
      type: string;
      attributes: {
        title: Record<string, string>;
        description: Record<string, string>;
        status: string;
        year: number;
        publicationDemographic: string;
        tags: Array<{
          id: string;
          type: string;
          attributes: {
            name: Record<string, string>;
          };
        }>;
        contentRating: string;
        lastChapter: string;
      };
      relationships: Array<{
        id: string;
        type: string;
        attributes?: {
          name?: string;
          fileName?: string;
        };
      }>;
    }>;
  }

const BASE_URL = config.BASE_URL;

/**
 * Obtiene mangas de MangaDex según parámetros específicos
 * @param params Parámetros de búsqueda
 * @returns Promise<Manga[]> Lista de mangas
 */
export const getMangas = async (params: {
  limit?: number;
  offset?: number;
  title?: string;
  genres?: string[];
  demographic?: string;
  order?: {
    rating?: 'desc' | 'asc';
    popularity?: 'desc' | 'asc';
    latest?: 'desc' | 'asc';
  };
}): Promise<Manga[]> => {
  try {
    // Construir la URL de búsqueda
    const url = new URL(`${BASE_URL}/manga`);
    
    // Parámetros básicos
    url.searchParams.append('includes[]', 'cover_art');
    url.searchParams.append('includes[]', 'author');
    url.searchParams.append('limit', (params.limit || 10).toString());
    url.searchParams.append('offset', (params.offset || 0).toString());

    // Filtros
    if (params.title) {
      url.searchParams.append('title', params.title);
    }
    
    if (params.demographic) {
      url.searchParams.append('publicationDemographic[]', params.demographic);
    }
    
    if (params.genres && params.genres.length > 0) {
      params.genres.forEach(genre => {
        url.searchParams.append('includedTags[]', genre);
      });
    }

    // Ordenamiento
    if (params.order) {
      if (params.order.rating) {
        url.searchParams.append('order[rating]', params.order.rating);
      }
      if (params.order.popularity) {
        url.searchParams.append('order[followedCount]', params.order.popularity);
      }
      if (params.order.latest) {
        url.searchParams.append('order[latestUploadedChapter]', params.order.latest);
      }
    }

    // Realizar la petición
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data: MangaListResponse = await response.json();

    // Procesar los datos para devolverlos en un formato más limpio
    return data.data.map(manga => {
      const attributes = manga.attributes;
      const relationships = manga.relationships;
      
      // Obtener la imagen de portada
      const coverArt = relationships.find(r => r.type === 'cover_art');
      const coverFileName = coverArt?.attributes?.fileName || '';
      const coverUrl = coverFileName 
        ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
        : null;

      // Obtener el autor
      const author = relationships.find(r => r.type === 'author')?.attributes?.name || 'Unknown';

      return {
        id: manga.id,
        title: attributes.title.en || Object.values(attributes.title)[0] || 'No title',
        description: attributes.description.en || Object.values(attributes.description)[0] || '',
        status: attributes.status,
        year: attributes.year,
        demographic: attributes.publicationDemographic || 'Unknown',
        tags: attributes.tags.map(tag => tag.attributes.name.en),
        rating: attributes.contentRating,
        lastChapter: attributes.lastChapter,
        coverUrl,
        author
      };
    });
  } catch (error) {
    console.error('Error fetching mangas:', error);
    throw new Error(`Error fetching mangas: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Función específica para obtener los 10 mangas seinen más populares
 * @returns Promise<Manga[]> Lista de 10 mangas seinen populares
 */
export const getTopSeinenMangas = async (): Promise<Manga[]> => {
  return getMangas({
    limit: 10,
    demographic: 'seinen',
    title:"berserk",
    order: {
      popularity: 'desc'
    }
  });
};