import config from "../config";
import { Chapter } from "../types";

// Interfaces mejoradas
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
    followers: number;
}

interface MangaListResponse {
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

interface StatisticsResponse {
    statistics?: {
        [mangaId: string]: {
            follows?: number;
            rating?: {
                average?: number;
                bayesian?: number;
            };
        };
    };
}

const BASE_URL = config.BASE_URL || "https://api.mangadex.org";



// export interface ChaptersResponse {
//   data: Chapter[];
//   limit: number;
//   offset: number;
//   total: number;
//   response?: Response; // Opcional: para debugging
// }

// export interface GetMangaChaptersOptions {
//   page?: number;
//   limit?: number;
//   languages?: string[];
//   order?: 'asc' | 'desc';
//   includes?: string[];
//   contentRating?: string[];
// }



// interface Chapter {
//   id: string;
//   attributes: {
//     chapter: string;
//     title: string;
//     translatedLanguage: string;
//     publishAt: string;
//     pages: number;
//     scanlationGroup?: string;
//   };
// }

export interface ChaptersResponse {
  data: Chapter[];
  limit: number;
  offset: number;
  total: number;
}

interface GetMangaChaptersOptions {
  page?: number;
  limit?: number;
  languages?: string[];
  order?: 'asc' | 'desc';
}

export const getMangaChapters = async (
  mangaId: string,
  options: GetMangaChaptersOptions = {}
): Promise<ChaptersResponse> => {
  const {
    page = 1,
    limit = 100,
    languages = ['es'],
    order = 'asc',
  } = options;

  try {
    // Construcción de URL más robusta como en getMangasWithStats
    const url = new URL(`https://api.mangadex.org/manga/${mangaId}/feed`);
    
    // Parámetros de consulta
    url.searchParams.append('limit', '500'); // Pedimos más para filtrar después
    languages.forEach(lang => url.searchParams.append('translatedLanguage[]', lang));
    url.searchParams.append('includes[]', 'scanlation_group');
    
    // Headers como en la otra función (importante para APK)
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Procesamiento con tipos más seguros
    const processedChapters: Chapter[] = data.data.map((chapter: any) => {
      const scanlationGroup = chapter.relationships?.find(
        (r: any) => r.type === 'scanlation_group'
      )?.attributes?.name;
      
      return {
        id: chapter.id,
        attributes: {
          chapter: chapter.attributes.chapter,
          title: chapter.attributes.title || '',
          translatedLanguage: chapter.attributes.translatedLanguage,
          publishAt: chapter.attributes.publishAt,
          pages: chapter.attributes.pages || 0,
          ...(scanlationGroup && { scanlationGroup })
        }
      };
    });

    // Ordenamiento numérico seguro
    processedChapters.sort((a, b) => {
      const numA = parseFloat(a.attributes.chapter) || 0;
      const numB = parseFloat(b.attributes.chapter) || 0;
      return order === 'asc' ? numA - numB : numB - numA;
    });

    // Paginación manual (mejorada)
    const startIndex = (page - 1) * limit;
    const paginatedChapters = processedChapters.slice(startIndex, startIndex + limit);

    return {
      data: paginatedChapters,
      limit,
      offset: startIndex,
      total: processedChapters.length
    };

  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw new Error(`Failed to get chapters: ${error instanceof Error ? error.message : String(error)}`);
  }
};
export const fetchChapterPages = async (chapterId: string) => {
  try {
    const serverResponse = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
    
    if (!serverResponse.ok) {
      throw new Error(`Error al obtener servidor: ${serverResponse.status}`);
    }
    
    const serverData = await serverResponse.json();
    
    if (!serverData.baseUrl || !serverData.chapter?.hash || !serverData.chapter?.data) {
      throw new Error('Datos del servidor incompletos');
    }
    
    const { baseUrl, chapter: chapterData } = serverData;
    return chapterData.data.map((fileName: string) => 
      `${baseUrl}/data/${chapterData.hash}/${fileName}`
    );
    
  } catch (err) {
    console.error('Error fetch de capitulo:', err);
    throw err; // Relanzamos el error para manejarlo en el componente
  }
};
/**
 * Función principal mejorada con manejo de tipos correcto
 */
export const getMangasWithStats = async (params: {
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
        // 1. Obtener listado de mangas
        const mangaUrl = new URL(`${BASE_URL}/manga`);
        
        mangaUrl.searchParams.append('includes[]', 'cover_art');
        mangaUrl.searchParams.append('includes[]', 'author');
        mangaUrl.searchParams.append('limit', (params.limit || 10).toString());
        mangaUrl.searchParams.append('offset', (params.offset || 0).toString());

        if (params.title) mangaUrl.searchParams.append('title', params.title);
        if (params.demographic) mangaUrl.searchParams.append('publicationDemographic[]', params.demographic);
        if (params.genres) params.genres.forEach(genre => mangaUrl.searchParams.append('includedTags[]', genre));

        if (params.order) {
            if (params.order.popularity) mangaUrl.searchParams.append('order[followedCount]', params.order.popularity);
            if (params.order.rating) mangaUrl.searchParams.append('order[rating]', params.order.rating);
            if (params.order.latest) mangaUrl.searchParams.append('order[latestUploadedChapter]', params.order.latest);
        }


        const mangaResponse = await fetch(mangaUrl.toString());
        if (!mangaResponse.ok) {
            throw new Error(`Manga request failed: ${mangaResponse.status}`);
        }
        const mangaData: MangaListResponse = await mangaResponse.json();

        // 2. Obtener estadísticas
        let statsData: StatisticsResponse = {};
        try {
            const mangaIds = mangaData.data.map(manga => manga.id);
            if (mangaIds.length > 0) {
                const statsUrl = new URL(`${BASE_URL}/statistics/manga`);
                statsUrl.searchParams.append('manga[]', mangaIds.join(','));
                

                const statsResponse = await fetch(statsUrl.toString());
                if (statsResponse.ok) {
                    statsData = await statsResponse.json() as StatisticsResponse;
                }
            }
        } catch (statsError) {
            console.warn("Error getting statistics, continuing without them:", statsError);
        }

        // 3. Procesar y combinar datos
        return mangaData.data.map(manga => {
            const attributes = manga.attributes;
            const relationships = manga.relationships;
            
            // Obtener portada
            const coverArt = relationships.find(r => r.type === 'cover_art');
            const coverFileName = coverArt?.attributes?.fileName || '';
            const coverUrl = coverFileName 
                ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
                : null;

            // Obtener autor
            const author = relationships.find(r => r.type === 'author')?.attributes?.name || 'Unknown';

            // Obtener estadísticas con tipo seguro
            const stats = statsData.statistics?.[manga.id];
            const followers = stats?.follows || 0;
            const ratingValue = stats?.rating?.average || 0;

            return {
                id: manga.id,
                title: attributes.title.en || Object.values(attributes.title)[0] || 'No title',
                description: attributes.description.en || Object.values(attributes.description)[0] || '',
                status: attributes.status,
                year: attributes.year,
                demographic: attributes.publicationDemographic || 'Unknown',
                tags: attributes.tags.map(tag => tag.attributes.name.en),
                rating: ratingValue.toString(),
                lastChapter: attributes.lastChapter,
                coverUrl,
                author,
                followers
            };
        });
    } catch (error) {
        console.error('Error in getMangasWithStats:', error);
        throw new Error(`Failed to fetch mangas: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Función optimizada para obtener los mejores mangas seinen
 */
export const getTopSeinenMangas = async (): Promise<Manga[]> => {
  try {
      const mustHaveTitles = [
          'Berserk',
          // 'Vinland Saga',
          'BLAME',
          "gantz",
          'Homunculus',
          'Fire Punch',
          'One Punch Man',
          'Danganronpa',
          'Vagabond',
          // 'Tokyo Ghoul',
          'Kingdom'
      ];

      const specificMangas = await Promise.all(
          mustHaveTitles.map(title => 
              getMangasWithStats({
                  limit: 1,
                  title: title,
                  demographic: 'seinen'
              }).then(mangas => mangas[0])
          )
      );

      

 

      const popularSeinen = await getMangasWithStats({
          limit: 26,
          demographic: 'seinen',
          order: { popularity: 'desc' }
      });

      const foundSpecificMangas = [...popularSeinen.filter(manga => 
        manga 
      ), ...specificMangas.filter(manga => 
          manga 
      )]

      // Corrección 1: Paréntesis de cierre en filter
      const allMangas = [

          ...foundSpecificMangas,
          // ...popularSeinen
      ];

      const sortedMangas = allMangas.sort((a, b) => b.followers - a.followers);

      const finalResults = [];
      const addedIds = new Set();

      // Corrección 2: Paréntesis de cierre en some()
      for (const manga of sortedMangas) {
          if (mustHaveTitles.some(title => 
              manga.title.toLowerCase().includes(title.toLowerCase()))) { // <- Paréntesis añadido
              if (!addedIds.has(manga.id)) {
                  finalResults.push(manga);
                  addedIds.add(manga.id);
              }
          }
          if (finalResults.length >= 36) break;
      }

      if (finalResults.length < 36) {
          for (const manga of sortedMangas) {
              if (!addedIds.has(manga.id)) {
                  finalResults.push(manga);
                  addedIds.add(manga.id);
              }
              if (finalResults.length >= 36) break;
          }
      }

      return finalResults.slice(0, 36);
  } catch (error) {
      console.error('Error in getTopSeinenMangas:', error);
      throw new Error(`Failed to fetch top seinen: ${error instanceof Error ? error.message : String(error)}`);
  }
};
