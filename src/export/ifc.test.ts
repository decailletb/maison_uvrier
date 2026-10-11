import { describe, expect, it } from "vitest";
import { house } from "@/data/house";
import { houseToIfc, ifcGuid, stepReal, stepString } from "./ifc";

const ifc = houseToIfc(house, { timestamp: "2026-10-11T12:00:00Z" });
const lines = ifc.split("\n").filter((l) => l.startsWith("#"));
const count = (type: string) => lines.filter((l) => l.includes(`=${type}(`)).length;

describe("STEP encoding", () => {
  it("escapes quotes and non-ASCII characters", () => {
    expect(stepString("d'après")).toBe("'d''apr\\X2\\00E8\\X0\\s'");
    expect(stepString("CHAMBRE 2")).toBe("'CHAMBRE 2'");
  });

  it("writes reals with a decimal point", () => {
    expect(stepReal(250)).toBe("250.");
    expect(stepReal(-0)).toBe("0.");
    expect(stepReal(12.34567)).toBe("12.3457");
  });

  it("derives stable 22-character GlobalIds", () => {
    expect(ifcGuid("wall:rez:ext-south")).toBe(ifcGuid("wall:rez:ext-south"));
    expect(ifcGuid("a")).not.toBe(ifcGuid("b"));
    expect(ifcGuid("a")).toMatch(/^[0-3][0-9A-Za-z_$]{21}$/);
  });
});

describe("houseToIfc", () => {
  it("is an IFC4 STEP file", () => {
    expect(ifc.startsWith("ISO-10303-21;")).toBe(true);
    expect(ifc).toContain("FILE_SCHEMA(('IFC4'));");
    expect(ifc.trimEnd().endsWith("END-ISO-10303-21;")).toBe(true);
  });

  it("only references entities it defines", () => {
    const defined = new Set(lines.map((l) => l.slice(0, l.indexOf("="))));
    for (const l of lines) {
      for (const ref of l.slice(l.indexOf("=") + 1).match(/#\d+/g) ?? []) expect(defined.has(ref), `${ref} in ${l}`).toBe(true);
    }
  });

  it("has unique GlobalIds", () => {
    const guids = lines.map((l) => l.match(/^#\d+=IFC\w+\('([0-9A-Za-z_$]{22})'/)?.[1]).filter(Boolean);
    expect(new Set(guids).size).toBe(guids.length);
  });

  it("exports every storey, wall, opening and room", () => {
    const walls = house.levels.reduce((n, l) => n + l.walls.length, 0);
    const openings = house.levels.flatMap((l) => l.openings);
    const rooms = house.levels.reduce((n, l) => n + l.rooms.length, 0);
    expect(count("IFCBUILDINGSTOREY")).toBe(house.levels.length + 1); // + TOITURE
    expect(count("IFCWALL")).toBe(walls + 4); // + acrotère on four sides
    expect(count("IFCOPENINGELEMENT")).toBe(openings.length);
    expect(count("IFCDOOR") + count("IFCWINDOW")).toBe(openings.filter((o) => o.kind !== "passage").length);
    expect(count("IFCSPACE")).toBe(rooms);
  });

  it("keeps room names as printed in the space long names", () => {
    expect(ifc).toContain(stepString("SEJOUR - CUISINE"));
    expect(ifc).toContain(stepString("CHAMBRE PARENTS"));
  });
});
