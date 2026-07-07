import { describe, expect, it } from "vitest"
import {
  isValidSlug,
  slugify,
  validateHierarchyStructure,
} from "./hierarchy-rules"

describe("validateHierarchyStructure", () => {
  it("accepts a movement with no parent", () => {
    expect(
      validateHierarchyStructure({
        type: "movement",
        parentType: null,
        deaneryId: null,
        parishId: null,
      }),
    ).toBeNull()
  })

  it("rejects a movement with a parent", () => {
    expect(
      validateHierarchyStructure({
        type: "movement",
        parentType: "movement",
        deaneryId: null,
        parishId: null,
      }),
    ).toMatch(/cannot have a parent/)
  })

  it("accepts a sub-movement under a movement", () => {
    expect(
      validateHierarchyStructure({
        type: "sub_movement",
        parentType: "movement",
        deaneryId: null,
        parishId: null,
      }),
    ).toBeNull()
  })

  it("rejects a sub-movement without a movement parent", () => {
    expect(
      validateHierarchyStructure({
        type: "sub_movement",
        parentType: null,
        deaneryId: null,
        parishId: null,
      }),
    ).toMatch(/must belong to a movement/)
    expect(
      validateHierarchyStructure({
        type: "sub_movement",
        parentType: "deanery_council",
        deaneryId: null,
        parishId: null,
      }),
    ).toMatch(/must belong to a movement/)
  })

  it("accepts a deanery council with a deanery and no parent", () => {
    expect(
      validateHierarchyStructure({
        type: "deanery_council",
        parentType: null,
        deaneryId: 3,
        parishId: null,
      }),
    ).toBeNull()
  })

  it("rejects a deanery council with a parent or without a deanery", () => {
    expect(
      validateHierarchyStructure({
        type: "deanery_council",
        parentType: "movement",
        deaneryId: 3,
        parishId: null,
      }),
    ).toMatch(/cannot have a parent/)
    expect(
      validateHierarchyStructure({
        type: "deanery_council",
        parentType: null,
        deaneryId: null,
        parishId: null,
      }),
    ).toMatch(/linked to a deanery/)
  })

  it("accepts a parish council under a deanery council with a parish", () => {
    expect(
      validateHierarchyStructure({
        type: "parish_council",
        parentType: "deanery_council",
        deaneryId: null,
        parishId: 7,
      }),
    ).toBeNull()
  })

  it("rejects a parish council without the right parent or parish", () => {
    expect(
      validateHierarchyStructure({
        type: "parish_council",
        parentType: null,
        deaneryId: null,
        parishId: 7,
      }),
    ).toMatch(/must belong to a deanery youth council/)
    expect(
      validateHierarchyStructure({
        type: "parish_council",
        parentType: "deanery_council",
        deaneryId: null,
        parishId: null,
      }),
    ).toMatch(/linked to a parish/)
  })
})

describe("slugify", () => {
  it("lowercases, strips punctuation, and hyphenates", () => {
    expect(slugify("St. George Deanery Youth Council")).toBe(
      "st-george-deanery-youth-council",
    )
    expect(slugify("St. Peter's Parish")).toBe("st-peters-parish")
    expect(slugify("  Knights of the Altar  ")).toBe("knights-of-the-altar")
  })
})

describe("isValidSlug", () => {
  it("accepts kebab-case slugs", () => {
    expect(isValidSlug("st-george")).toBe(true)
    expect(isValidSlug("cym")).toBe(true)
  })

  it("rejects malformed slugs", () => {
    expect(isValidSlug("")).toBe(false)
    expect(isValidSlug("-leading")).toBe(false)
    expect(isValidSlug("trailing-")).toBe(false)
    expect(isValidSlug("Upper-Case")).toBe(false)
    expect(isValidSlug("two--hyphens")).toBe(false)
  })
})
