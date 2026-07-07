export type HierarchyNodeType =
  | "movement"
  | "sub_movement"
  | "deanery_council"
  | "parish_council"

export const HIERARCHY_TYPE_LABELS: Record<HierarchyNodeType, string> = {
  movement: "Movement",
  sub_movement: "Sub-movement",
  deanery_council: "Deanery Youth Council",
  parish_council: "Parish Youth Council",
}

// Which child type each node type may contain (null = leaf)
export const HIERARCHY_CHILD_TYPE: Record<HierarchyNodeType, HierarchyNodeType | null> = {
  movement: "sub_movement",
  sub_movement: null,
  deanery_council: "parish_council",
  parish_council: null,
}

export function validateHierarchyStructure(input: {
  type: HierarchyNodeType
  parentType: HierarchyNodeType | null
  deaneryId: number | null
  parishId: number | null
}): string | null {
  const { type, parentType, deaneryId, parishId } = input

  switch (type) {
    case "movement":
      if (parentType !== null) {
        return "A movement cannot have a parent — it is a top-level entry."
      }
      return null
    case "sub_movement":
      if (parentType !== "movement") {
        return "A sub-movement must belong to a movement."
      }
      return null
    case "deanery_council":
      if (parentType !== null) {
        return "A deanery youth council cannot have a parent — it is a top-level entry."
      }
      if (!deaneryId) {
        return "A deanery youth council must be linked to a deanery."
      }
      return null
    case "parish_council":
      if (parentType !== "deanery_council") {
        return "A parish youth council must belong to a deanery youth council."
      }
      if (!parishId) {
        return "A parish youth council must be linked to a parish."
      }
      return null
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
}
