import type { MaterialList } from "@prisma/client";
import type { MaterialListItem, MaterialListPublic } from "@conectaobra/types/material-lists";

export function toPublicMaterialList(list: MaterialList): MaterialListPublic {
  return {
    id: list.id,
    obraId: list.obraId,
    itens: list.itens as unknown as MaterialListItem[],
    origem: list.origem,
    createdAt: list.createdAt.toISOString(),
  };
}
