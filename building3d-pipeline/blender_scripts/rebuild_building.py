"""
blender_scripts/rebuild_building.py
Runs INSIDE Blender's Python environment (bpy).

Invoked by phase6_rebuild.py as:
  blender -b --python rebuild_building.py -- \
    --analysis /path/to/building_analysis.json \
    --output   /path/to/building_v1.blend

Pipeline:
  6.1  Parse args, load analysis JSON
  6.2  Clear scene
  6.3  Extrude footprint to wall height (base box)
  6.4  Generate roof (gabled / flat / shed / hipped / pyramidal)
  6.5  Cut window and door boolean openings
  6.6  Assign Principled BSDF materials per region
  6.7  Wire Geometry Nodes parametric rig
  6.8  Save .blend
"""

import argparse
import json
import math
import sys

# bpy is only available inside Blender
import bpy
import bmesh
from mathutils import Vector


# ---------------------------------------------------------------------------
# Argument parsing (args after --)
# ---------------------------------------------------------------------------

def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--analysis", required=True)
    parser.add_argument("--output",   required=True)
    return parser.parse_args(argv)


# ---------------------------------------------------------------------------
# 6.2  Scene setup
# ---------------------------------------------------------------------------

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def target_collection() -> bpy.types.Collection:
    """
    Headless Blender runs do not reliably populate bpy.context.collection.
    Always link new objects through the active scene collection instead.
    """
    scene = bpy.context.scene
    if scene and scene.collection:
        return scene.collection

    collection = bpy.data.collections.get("PipelineCollection")
    if collection is None:
        collection = bpy.data.collections.new("PipelineCollection")
        if scene:
            scene.collection.children.link(collection)
    return collection


# ---------------------------------------------------------------------------
# 6.3  Base box from footprint
# ---------------------------------------------------------------------------

def build_base(footprint: list, wall_height: float) -> bpy.types.Object:
    """
    Extrude the footprint polygon upward to wall_height.
    footprint: list of [x, z] pairs (XZ plane = top-down)
    Returns the base mesh object.
    """
    mesh = bpy.data.meshes.new("BuildingBase")
    obj  = bpy.data.objects.new("Building", mesh)
    target_collection().objects.link(obj)

    bm = bmesh.new()

    # Create base face in XY plane (Blender Y = depth, X = width, Z = up)
    base_verts = [bm.verts.new(Vector((pt[0], pt[1], 0.0))) for pt in footprint]
    bm.faces.new(base_verts)
    bm.normal_update()

    # Extrude upward
    result = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    top_verts = [v for v in result["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top_verts, vec=Vector((0.0, 0.0, wall_height)))

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    return obj


# ---------------------------------------------------------------------------
# 6.4  Roof generation
# ---------------------------------------------------------------------------

def add_roof(base_obj: bpy.types.Object, analysis: dict) -> bpy.types.Object | None:
    roof_type  = analysis.get("roof_type",      "gabled")
    pitch_deg  = analysis.get("roof_pitch_deg", 30.0)
    wall_h     = analysis.get("wall_height_m",  6.0)
    footprint  = analysis.get("footprint",      [[-4, -3], [4, -3], [4, 3], [-4, 3]])

    xs = [p[0] for p in footprint]
    ys = [p[1] for p in footprint]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    cx = (min_x + max_x) / 2
    cy = (min_y + max_y) / 2
    width  = max_x - min_x
    depth  = max_y - min_y
    pitch_h = math.tan(math.radians(pitch_deg)) * (width / 2)

    mesh = bpy.data.meshes.new("Roof")
    obj  = bpy.data.objects.new("Roof", mesh)
    target_collection().objects.link(obj)
    bm = bmesh.new()

    if roof_type == "flat":
        # Cap the top face — just a flat plane
        verts = [
            bm.verts.new(Vector((min_x, min_y, wall_h))),
            bm.verts.new(Vector((max_x, min_y, wall_h))),
            bm.verts.new(Vector((max_x, max_y, wall_h))),
            bm.verts.new(Vector((min_x, max_y, wall_h))),
        ]
        bm.faces.new(verts)

    elif roof_type == "gabled":
        # Ridge runs front-to-back, apex at cx
        ridge_z = wall_h + pitch_h
        bl = bm.verts.new(Vector((min_x, min_y, wall_h)))
        br = bm.verts.new(Vector((max_x, min_y, wall_h)))
        tl = bm.verts.new(Vector((min_x, max_y, wall_h)))
        tr = bm.verts.new(Vector((max_x, max_y, wall_h)))
        rl = bm.verts.new(Vector((cx, min_y, ridge_z)))
        rr = bm.verts.new(Vector((cx, max_y, ridge_z)))
        # Left slope
        bm.faces.new([bl, rl, rr, tl])
        # Right slope
        bm.faces.new([br, tr, rr, rl])
        # Gable ends
        bm.faces.new([bl, br, rl])
        bm.faces.new([tl, rr, tr])

    elif roof_type == "shed":
        # Single slope: high at back, low at front
        shed_h = math.tan(math.radians(pitch_deg)) * depth
        bl = bm.verts.new(Vector((min_x, min_y, wall_h)))
        br = bm.verts.new(Vector((max_x, min_y, wall_h)))
        tl = bm.verts.new(Vector((min_x, max_y, wall_h + shed_h)))
        tr = bm.verts.new(Vector((max_x, max_y, wall_h + shed_h)))
        bm.faces.new([bl, br, tr, tl])
        bm.faces.new([bl, tl, tr, br])  # duplicate for manifold

    elif roof_type == "hipped":
        # Four slopes meeting at a central ridge
        ridge_z = wall_h + pitch_h
        ridge_half = depth * 0.3  # ridge runs along Y
        bl = bm.verts.new(Vector((min_x, min_y, wall_h)))
        br = bm.verts.new(Vector((max_x, min_y, wall_h)))
        tl = bm.verts.new(Vector((min_x, max_y, wall_h)))
        tr = bm.verts.new(Vector((max_x, max_y, wall_h)))
        rl = bm.verts.new(Vector((cx, cy - ridge_half, ridge_z)))
        rr = bm.verts.new(Vector((cx, cy + ridge_half, ridge_z)))
        # Front slope
        bm.faces.new([bl, br, rl])
        # Back slope
        bm.faces.new([tl, rr, tr])
        # Left slope
        bm.faces.new([bl, rl, rr, tl])
        # Right slope
        bm.faces.new([br, tr, rr, rl])

    elif roof_type == "pyramidal":
        # All four edges meet at a single apex
        apex_z = wall_h + pitch_h
        apex = bm.verts.new(Vector((cx, cy, apex_z)))
        bl   = bm.verts.new(Vector((min_x, min_y, wall_h)))
        br   = bm.verts.new(Vector((max_x, min_y, wall_h)))
        tr   = bm.verts.new(Vector((max_x, max_y, wall_h)))
        tl   = bm.verts.new(Vector((min_x, max_y, wall_h)))
        bm.faces.new([bl, br, apex])
        bm.faces.new([br, tr, apex])
        bm.faces.new([tr, tl, apex])
        bm.faces.new([tl, bl, apex])

    else:
        bm.free()
        return None

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj.location.z = 0.0
    return obj


# ---------------------------------------------------------------------------
# 6.5  Window and door boolean cutouts
# ---------------------------------------------------------------------------

def cut_opening(building_obj: bpy.types.Object,
                x: float, y: float, z: float,
                width: float, height: float, depth: float = 0.5,
                name: str = "Opening"):
    """Cut a rectangular opening through building_obj using Boolean difference."""
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(x, y, z)
    )
    cutter = bpy.context.active_object
    cutter.name = name + "_cutter"
    cutter.scale = (width, depth, height)
    bpy.ops.object.transform_apply(scale=True)

    bpy.context.view_layer.objects.active = building_obj
    mod = building_obj.modifiers.new(name=name + "_bool", type="BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)

    # Hide cutter
    cutter.hide_set(True)
    cutter.hide_render = True


def cut_all_openings(building_obj: bpy.types.Object, analysis: dict):
    wall_h = analysis.get("wall_height_m", 6.0)

    # Windows
    for i, win in enumerate(analysis.get("window_positions_3d", [])):
        w = win.get("width",  1.0)
        h = win.get("height", 1.2)
        cut_opening(
            building_obj,
            x=win.get("x", 0), y=win.get("z", -0.01), z=win.get("y", wall_h * 0.5),
            width=w, height=h,
            name=f"Window_{i:02d}"
        )
        print(f"  Cut window {i} at ({win.get('x',0):.2f}, {win.get('y',0):.2f})")

    # Door
    door = analysis.get("door_position_3d")
    if door:
        w = door.get("width",  1.2)
        h = door.get("height", 2.4)
        cut_opening(
            building_obj,
            x=door.get("x", 0), y=door.get("z", -0.01), z=h / 2,
            width=w, height=h,
            name="Door_00"
        )
        print(f"  Cut door at ({door.get('x',0):.2f})")


# ---------------------------------------------------------------------------
# 6.6  Material assignment
# ---------------------------------------------------------------------------

def hex_to_linear(hex_color: str) -> tuple:
    """Convert #rrggbb hex to linear RGBA tuple for Blender."""
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    # sRGB → linear approximation
    def srgb(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (srgb(r), srgb(g), srgb(b), 1.0)


def make_material(name: str, base_color: tuple,
                   roughness: float = 0.7) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value  = roughness
    return mat


def assign_materials(building_obj: bpy.types.Object,
                      roof_obj: bpy.types.Object | None,
                      analysis: dict):
    labels = analysis.get("material_labels", {})
    palette = analysis.get("color_palette", [[200, 160, 112]])

    # Default colours
    wall_hex  = labels.get("plaster") or labels.get("stone") or "#c8a070"
    roof_hex  = labels.get("dark-metal") or "#b14c2e"
    trim_hex  = labels.get("generic") or "#efe2cf"

    wall_mat = make_material("Wall",  hex_to_linear(wall_hex), roughness=0.75)
    roof_mat = make_material("Roof",  hex_to_linear(roof_hex), roughness=0.6)
    trim_mat = make_material("Trim",  hex_to_linear(trim_hex), roughness=0.5)

    building_obj.data.materials.append(wall_mat)
    building_obj.data.materials.append(trim_mat)

    if roof_obj:
        roof_obj.data.materials.append(roof_mat)

    print(f"  Materials: wall={wall_hex}, roof={roof_hex}, trim={trim_hex}")


# ---------------------------------------------------------------------------
# 6.7  Geometry Nodes parametric rig
# ---------------------------------------------------------------------------

def setup_geometry_nodes(building_obj: bpy.types.Object, analysis: dict):
    """
    Attach a Geometry Nodes modifier with live parameters exposed and geometry
    properly passed through so the mesh remains visible in exports.
    """
    mod = building_obj.modifiers.new("BuildingParams", "NODES")
    ng  = bpy.data.node_groups.new("BuildingParams", "GeometryNodeTree")
    mod.node_group = ng

    nodes = ng.nodes
    links = ng.links
    nodes.clear()

    # Input / Output sockets (Blender 4.0+ uses ng.interface; 3.x uses ng.inputs/outputs)
    try:
        iface = ng.interface
        iface.new_socket("Geometry",         in_out="INPUT",  socket_type="NodeSocketGeometry")
        iface.new_socket("Floor Count",      in_out="INPUT",  socket_type="NodeSocketInt")
        iface.new_socket("Wall Height",      in_out="INPUT",  socket_type="NodeSocketFloat")
        iface.new_socket("Roof Type",        in_out="INPUT",  socket_type="NodeSocketInt")
        iface.new_socket("Window Density",   in_out="INPUT",  socket_type="NodeSocketFloat")
        iface.new_socket("Geometry",         in_out="OUTPUT", socket_type="NodeSocketGeometry")
    except AttributeError:
        ng.inputs.new("NodeSocketGeometry", "Geometry")
        ng.inputs.new("NodeSocketInt",      "Floor Count")
        ng.inputs.new("NodeSocketFloat",    "Wall Height")
        ng.inputs.new("NodeSocketInt",      "Roof Type")
        ng.inputs.new("NodeSocketFloat",    "Window Density")
        ng.outputs.new("NodeSocketGeometry", "Geometry")

    # Passthrough: Group Input → Group Output (geometry socket index 0)
    group_in  = nodes.new("NodeGroupInput")
    group_out = nodes.new("NodeGroupOutput")
    group_in.location  = (-300, 0)
    group_out.location = (300, 0)
    links.new(group_in.outputs[0], group_out.inputs[0])

    # Set default values from analysis
    floor_count = analysis.get("floor_count", 2)
    wall_height = analysis.get("wall_height_m", 6.0)
    roof_type_map = {"flat": 0, "shed": 1, "gabled": 2, "hipped": 3, "pyramidal": 4}
    roof_type_int = roof_type_map.get(analysis.get("roof_type", "gabled"), 2)

    mod["Input_1"] = floor_count    # Floor Count  (index 0 is Geometry)
    mod["Input_2"] = wall_height    # Wall Height
    mod["Input_3"] = roof_type_int  # Roof Type
    mod["Input_4"] = 1.0            # Window Density

    print(f"  GeoNodes rig: floors={floor_count}, height={wall_height:.1f}m, roof_type={roof_type_int}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    print(f"\n{'='*60}")
    print(" Blender Parametric Building Rebuild")
    print(f"{'='*60}")
    print(f"Analysis: {args.analysis}")
    print(f"Output:   {args.output}")

    # Load analysis
    with open(args.analysis) as f:
        analysis = json.load(f)

    footprint  = analysis.get("footprint",     [[-4, -3], [4, -3], [4, 3], [-4, 3]])
    wall_h     = analysis.get("wall_height_m", 6.0)
    floor_count = analysis.get("floor_count",  2)

    print(f"\nBuilding: {floor_count} floors, {wall_h:.1f}m tall, "
          f"{len(footprint)}-vertex footprint, roof={analysis.get('roof_type','gabled')}")

    # 6.2 Clear scene
    clear_scene()
    print("\n[6.2] Scene cleared")

    # 6.3 Base box
    print("[6.3] Extruding footprint...")
    building_obj = build_base(footprint, wall_h)

    # 6.4 Roof
    print("[6.4] Building roof...")
    roof_obj = add_roof(building_obj, analysis)

    # 6.5 Openings
    windows = analysis.get("window_positions_3d", [])
    door    = analysis.get("door_position_3d")
    if windows or door:
        print(f"[6.5] Cutting {len(windows)} windows + {'1 door' if door else 'no door'}...")
        cut_all_openings(building_obj, analysis)
    else:
        print("[6.5] No openings data — skipping boolean cuts")

    # 6.6 Materials
    print("[6.6] Assigning materials...")
    assign_materials(building_obj, roof_obj, analysis)

    # 6.7 GeoNodes rig
    print("[6.7] Setting up Geometry Nodes parametric rig...")
    setup_geometry_nodes(building_obj, analysis)

    # 6.8 Save .blend
    import os
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=args.output)
    print(f"\n[6.8] Saved → {args.output}")
    print("="*60)


if __name__ == "__main__":
    main()
