import { beforeEach, describe, expect, it } from "vitest";
import { useEditor } from "./store";

const bed = { asset: { procedural: "bed" as const, params: {} }, levelId: "etage" as const, roomId: "chambre-parents", position: [200, 180, 0] as [number, number, number], rotationY: 0, scale: 1 };

describe("editor store", () => {
  beforeEach(() => useEditor.getState().newScene("test"));

  it("adds, moves, duplicates and removes items with undo / redo", () => {
    const s = useEditor.getState();
    const id = s.addItem(bed);
    expect(useEditor.getState().scene.items).toHaveLength(1);
    expect(useEditor.getState().selectedId).toBe(id);
    s.updateItem(id, { rotationY: 90 });
    expect(useEditor.getState().scene.items[0].rotationY).toBe(90);
    s.duplicateItem(id);
    expect(useEditor.getState().scene.items).toHaveLength(2);
    expect(useEditor.getState().scene.items[1].position[0]).toBe(260);
    s.undo();
    expect(useEditor.getState().scene.items).toHaveLength(1);
    s.undo();
    expect(useEditor.getState().scene.items[0].rotationY).toBe(0);
    s.redo();
    expect(useEditor.getState().scene.items[0].rotationY).toBe(90);
    s.select(id);
    s.removeItem(id);
    expect(useEditor.getState().scene.items).toHaveLength(0);
    expect(useEditor.getState().selectedId).toBeNull();
    expect(useEditor.getState().dirty).toBe(true);
  });

  it("sets room finishes", () => {
    useEditor.getState().setRoomFinish("sejour-cuisine", "floor", "parquet-oak");
    expect(useEditor.getState().scene.roomFinishes["sejour-cuisine"].floor).toBe("parquet-oak");
    useEditor.getState().setRoomFinish("sejour-cuisine", "wall", "paint-sage");
    expect(useEditor.getState().scene.roomFinishes["sejour-cuisine"]).toEqual({ floor: "parquet-oak", wall: "paint-sage" });
  });
});
