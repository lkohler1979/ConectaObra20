import { z } from "zod";

/** Ponto lat/lng — compartilhado por qualquer entidade com campo `geo` (PostGIS) no schema. */
export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof geoPointSchema>;
