/**
 * Writes the house as an IFC4 file for Archicad (File > Open > villa-lacapela.ifc).
 * Usage: npm run export:ifc [-- <output path>]   (default archicad/villa-lacapela.ifc)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { house } from "@/data/house";
import { houseToIfc } from "@/export/ifc";

const out = resolve(process.argv[2] ?? "archicad/villa-lacapela.ifc");
mkdirSync(dirname(out), { recursive: true });
const ifc = houseToIfc(house, { fileName: basename(out) });
writeFileSync(out, ifc);
const entities = ifc.split("\n").filter((l) => l.startsWith("#")).length;
console.log(`${out}: ${entities} entities, ${(ifc.length / 1024).toFixed(0)} KiB`);
