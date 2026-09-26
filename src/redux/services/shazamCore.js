import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { MOCK_SONGS, getMockArtistDetails } from "../../assets/mockData";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "https://shazam-core.p.rapidapi.com/v1",
  prepareHeaders: (headers) => {
    const apiKey =
      import.meta.env.VITE_SHAZAM_CORE_RAPID_API_KEY ||
      "d28d2bf077mshe2e45e344bbc036p1a38b8jsna7170ce70020";
    headers.set("X-RapidAPI-Key", apiKey);
    headers.set("X-RapidAPI-Host", "shazam-core.p.rapidapi.com");
    return headers;
  },
});

const baseQueryWithFallback = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const url = typeof args === "string" ? args : args.url;

    if (url.includes("/charts/world") || url.includes("/charts/country")) {
      return { data: MOCK_SONGS };
    }
    if (url.includes("/charts/genre-world")) {
      const genreParam = url.split("genre_code=")[1] || "";
      const genre = decodeURIComponent(genreParam).toUpperCase();
      const filtered = MOCK_SONGS.filter(
        (s) => s.genres.primary.toUpperCase() === genre
      );
      return { data: filtered.length > 0 ? filtered : MOCK_SONGS };
    }
    if (url.includes("/tracks/details")) {
      const songid = url.split("track_id=")[1] || "";
      const song = MOCK_SONGS.find((s) => s.key === songid) || MOCK_SONGS[0];
      return { data: song };
    }
    if (url.includes("/tracks/related")) {
      return { data: MOCK_SONGS };
    }
    if (url.includes("/artists/details")) {
      const artistId = url.split("artist_id=")[1] || "";
      return { data: getMockArtistDetails(artistId) };
    }
    if (url.includes("/search/multi")) {
      const searchTerm = decodeURIComponent(
        url.split("query=")[1] || ""
      ).toLowerCase();
      const filtered = MOCK_SONGS.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm) ||
          s.subtitle.toLowerCase().includes(searchTerm)
      );
      const results = filtered.length > 0 ? filtered : MOCK_SONGS;
      return {
        data: {
          tracks: {
            hits: results.map((track) => ({ track })),
          },
        },
      };
    }
    return { data: MOCK_SONGS };
  }

  return result;
};

export const shazamCoreApi = createApi({
  reducerPath: "shazamCoreApi",
  baseQuery: baseQueryWithFallback,
  endpoints: (builder) => ({
    getTopCharts: builder.query({ query: () => "/charts/world" }),
    getSongsByGenre: builder.query({
      query: (genre) => `/charts/genre-world?genre_code=${genre}`,
    }),
    getSongDetails: builder.query({
      query: ({ songid }) => `/tracks/details?track_id=${songid}`,
    }),
    getSongRelated: builder.query({
      query: ({ songid }) => `/tracks/related?track_id=${songid}`,
    }),
    getArtistDetails: builder.query({
      query: (artistId) => `/artists/details?artist_id=${artistId}`,
    }),
    getSongsByCountry: builder.query({
      query: (countryCode) => `/charts/country?country_code=${countryCode}`,
    }),
    getSongsBySearch: builder.query({
      query: (searchTerm) =>
        `/search/multi?search_type=SONGS_ARTISTS&query=${searchTerm}`,
    }),
  }),
});

export const {
  useGetTopChartsQuery,
  useGetSongsByGenreQuery,
  useGetSongDetailsQuery,
  useGetSongRelatedQuery,
  useGetArtistDetailsQuery,
  useGetSongsByCountryQuery,
  useGetSongsBySearchQuery,
} = shazamCoreApi;
