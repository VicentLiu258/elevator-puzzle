"""Original vinyl-doll elevator assets. Blender 5.2; no downloaded assets.
Run: Blender --background --python generate_diorama.py [-- --sample]
Exports FBX (Creator), .blend (editable), manifest and preview PNG.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'cocos/assets/resources/models'
OUT.mkdir(parents=True,exist_ok=True)
SAMPLE='--sample' in sys.argv
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
M={}
def mat(name,hex,rough=.48,metal=0):
    h=hex.lstrip('#'); c=tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
    m=bpy.data.materials.new(name); m.diffuse_color=(*c,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*c,1); bs.inputs['Roughness'].default_value=rough; bs.inputs['Metallic'].default_value=metal
    M[name]=m; return m
for a in [('skin','#edbc92',.4,0),('skin2','#bf8664',.43,0),('hair','#332923',.32,0),('eye','#161d22',.18,0),('cream','#f5ecda',.68,0),('sole','#d7cbbb',.65,0),('teal','#457a71',.65,0),('orange','#dc744b',.58,0),('navy','#34465b',.68,0),('yellow','#e9b64f',.42,0),('pink','#d8958a',.65,0),('paper','#d2a36b',.8,0),('tape','#ecd3a6',.73,0),('metal','#a8b9b7',.32,.5),('brass','#bca071',.3,.55),('wall','#53776e',.76,0),('trim','#2c4b49',.5,0),('floor','#d9c8a6',.6,0),('tile','#c7b694',.68,0),('shadow','#394942',.9,0),('light','#ffe5a2',.35,0)]: mat(*a)
current=[]
def finish(o,name,material):
    o.name=name; o.data.materials.append(M[material]); current.append(o); return o

def sphere(name,loc,scale,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=loc)
    o=finish(bpy.context.object,name,material); o.scale=scale
    for p in o.data.polygons:p.use_smooth=True
    return o

def box(name,loc,scale,material,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=finish(bpy.context.object,name,material); o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def tube(name,points,r,material):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=r;c.bevel_resolution=3
    sp=c.splines.new('POLY');sp.points.add(len(points)-1)
    for p,co in zip(sp.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);finish(o,name,material)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o

def torus(name,loc,major,minor,material,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=32,minor_segments=8,location=loc,rotation=rotation)
    return finish(bpy.context.object,name,material)

def export(name):
    # Preserve articulated toy limbs as separate rigid meshes with joint origins.
    meshes=list(current); groups={}
    for o in meshes:groups.setdefault(o.get('part','Body'),[]).append(o)
    articulated=name in ['student','office','courier','traveller','mover','coach']
    root=None; exported=[];tris=0
    if articulated:
        root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
    for part,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join()
        obj=bpy.context.object;obj.name=part if articulated else name
        pivot={'WalkLeg_L':(-.14,0,.44),'WalkLeg_R':(.14,0,.44),'WalkArm_L':(-.30,0,.80),'WalkArm_R':(.30,0,.80)}.get(part,(0,0,0))
        bpy.context.scene.cursor.location=pivot;bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
        if root:obj.parent=root
        exported.append(obj);tris+=sum(len(p.vertices)-2 for p in obj.data.polygons)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in exported:obj.select_set(True)
    if root:root.select_set(True)
    bpy.ops.export_scene.fbx(filepath=str(OUT/(name+'.fbx')),use_selection=True,object_types={'MESH','EMPTY'},axis_forward='-Z',axis_up='Y',apply_unit_scale=True,bake_space_transform=True,add_leaf_bones=False,path_mode='AUTO',mesh_smooth_type='FACE',use_mesh_modifiers=True)
    current.clear();return root or exported[0],tris

assets={}; counts={}
def doll(kind):
    outfit={'student':'teal','office':'navy','courier':'yellow','traveller':'orange','mover':'teal','coach':'pink'}[kind]
    skin='skin2' if kind in ['coach','mover'] else 'skin'
    # Large vinyl head, a compact clothed torso, articulated seams, rubber sneakers.
    for x in [-.14,.14]:
        limb_start=len(current)
        box('Sneaker',(x,-.075,.095),(.24,.36,.16),'cream',.065)
        box('Rubber sole',(x,-.075,.035),(.245,.365,.055),'sole',.022)
        box('Trouser leg',(x,.015,.3),(.19,.21,.34),'navy',.065)
        for y in [-.12,-.17]:tube('Laces',[(x-.065,y,.171),(x+.065,y,.171)],.008,'cream')
        for o in current[limb_start:]:o['part']='WalkLeg_L' if x<0 else 'WalkLeg_R'
    sphere('Cloth torso',(0,.02,.64),(.30,.19,.34),outfit)
    box('Jacket hem',(0,-.005,.43),(.48,.31,.065),outfit,.025)
    for s in [-1,1]:
        limb_start=len(current)
        arm=sphere('Sleeve',(s*.30,.0,.64),(.105,.115,.235),outfit);arm.rotation_euler[1]=s*-.17
        sphere('Vinyl hand',(s*.335,-.025,.43),(.085,.085,.10),skin)
        for o in current[limb_start:]:o['part']='WalkArm_L' if s<0 else 'WalkArm_R'
        sphere('Ear',(s*.34,0,1.1),(.065,.06,.09),skin)
    sphere('Neck',(0,0,.89),(.10,.10,.12),skin)
    sphere('Vinyl head',(0,-.01,1.15),(.35,.28,.345),skin)
    # Front is Blender -Y, exported to Creator +Z.
    for x in [-.12,.12]:
        sphere('Gloss eye',(x,-.275,1.17),(.040,.025,.052),'eye')
        sphere('Eye glint',(x-.012,-.298,1.187),(.012,.006,.014),'cream')
        sphere('Cheek',(x*1.55,-.252,1.075),(.048,.012,.025),'pink')
    sphere('Nose',(0,-.294,1.09),(.044,.043,.036),skin)
    tube('Smile',[(-.055,-.275,1.025),(0,-.287,1.013),(.055,-.275,1.025)],.009,'hair')
    sphere('Sculpted hair cap',(0,.03,1.37),(.34,.265,.17),'hair')
    for i in range(4):
        o=sphere('Moulded hair lock',(-.22+i*.125,-.20,1.39-i*.018),(.12,.09,.095),'hair');o.rotation_euler[1]=-.25
    # Jacket zipper, collar and patch convey manufactured toy details at game scale.
    tube('Zipper',[(0,-.178,.46),(0,-.184,.83)],.009,'brass')
    for s in [-1,1]:
        o=box('Collar',(s*.075,-.154,.84),(.14,.045,.11),'cream',.018);o.rotation_euler[1]=s*.4
    box('Woven pocket',(-.14,-.172,.64),(.105,.025,.10),outfit,.015)
    if kind=='student':
        box('Canvas backpack',(0,.23,.67),(.40,.18,.43),'orange',.09)
        for x in [-.18,.18]:tube('Backpack strap',[(x,.24,.83),(x,-.13,.83),(x,-.17,.50)],.021,'orange')
        box('Book',(.34,-.08,.55),(.10,.18,.25),'cream',.015)
    if kind=='office':
        for x in [-.12,.12]:torus('Glasses',(x,-.305,1.18),.068,.012,'brass',(math.pi/2,0,0))
        tube('Glasses bridge',[(-.05,-.31,1.18),(.05,-.31,1.18)],.008,'brass')
        box('Briefcase',(.43,-.015,.27),(.26,.13,.24),'paper',.03)
        tube('Case handle',[(.36,0,.38),(.36,0,.45),(.49,0,.45),(.49,0,.38)],.015,'hair')
        box('Tie',(0,-.205,.72),(.055,.025,.19),'orange',.01)
    if kind=='courier':
        sphere('Helmet',(0,.01,1.43),(.37,.30,.16),'yellow')
        box('Helmet brim',(0,-.27,1.40),(.50,.17,.045),'yellow',.03)
        box('Delivery box',(0,.27,.68),(.49,.30,.45),'yellow',.055)
        box('Delivery reflective patch',(0,.428,.69),(.29,.018,.16),'cream',.012)
        for x in [-.20,.20]:tube('Box harness',[(x,.3,.87),(x,-.14,.81),(x,-.17,.5)],.018,'navy')
    if kind=='traveller':
        box('Carry-on',(.45,-.04,.34),(.30,.26,.48),'teal',.065)
        for x in [.35,.55]:sphere('Luggage wheels',(x,-.04,.075),(.05,.065,.05),'hair')
        for x in [.40,.50]:tube('Luggage handle',[(x,0,.55),(x,0,.78)],.012,'metal')
        tube('Handle grip',[(.4,0,.78),(.5,0,.78)],.022,'hair')
        for x in [.37,.45,.53]:tube('Luggage ribs',[(x,-.177,.17),(x,-.177,.50)],.009,'metal')
        torus('Hat brim',(0,.01,1.43),.34,.055,'paper')
        sphere('Hat crown',(0,.015,1.48),(.27,.22,.14),'paper')
        tube('Scarf',[(-.22,-.13,.86),(0,-.21,.82),(.23,-.13,.87)],.04,'cream')
    if kind=='mover':
        box('Work cap',(0,.015,1.48),(.5,.42,.10),'teal',.07)
        box('Cap visor',(0,-.245,1.44),(.45,.16,.04),'teal',.025)
        for x in [-.16,.16]:tube('Overall straps',[(x,-.15,.86),(x,-.19,.50)],.028,'navy')
        for x in [-.15,.15]:sphere('Overall button',(x,-.217,.67),(.02,.012,.02),'brass')
    if kind=='coach':
        tube('Headband',[(-.31,-.10,1.36),(-.20,-.23,1.38),(0,-.28,1.39),(.20,-.23,1.38),(.31,-.10,1.36)],.035,'cream')
        # Small hand weight, not physique exaggeration.
        tube('Dumbbell grip',[(.29,-.02,.43),(.49,-.02,.43)],.025,'metal')
        for x in [.27,.51]:box('Dumbbell end',(x,-.02,.43),(.075,.15,.15),'navy',.025)
    return export(kind)

kinds=['student'] if SAMPLE else ['student','office','courier','traveller','mover','coach']
for kind in kinds:assets[kind],counts[kind]=doll(kind)
# A cutaway lift with no front/roof to hide the passengers.
box('Cabin plinth',(0,0,-.15),(5.5,3.5,.30),'trim',.12)
box('Floor',(0,0,.015),(5.24,3.3,.10),'floor',.06)
for x in [-1.75,0,1.75]:
    for y in [-.83,.83]:box('Inset floor tile',(x,y,.071),(1.70,1.59,.02),'tile',.025)
box('Rear wall',(0,1.68,2.05),(5.5,.2,4.25),'wall',.08)
box('Rear inset',(0,1.54,2.06),(4.85,.11,3.62),'trim',.04)
box('Warm wall panel',(0,1.47,2.1),(4.62,.05,3.42),'wall',.03)
for x in [-2.62,2.62]:
    box('Side cutaway wall',(x,.35,.85),(.20,2.6,1.9),'wall',.07)
    box('Brass side cap',(x,.35,1.82),(.24,2.65,.06),'brass',.025)
    box('Front jamb',(x,-1.64,2.05),(.28,.26,4.25),'trim',.04)
    box('Jamb inlay',(x,-1.795,2.05),(.06,.025,3.9),'brass',.012)
box('Header',(0,-1.64,4.13),(5.7,.36,.36),'trim',.06)
box('Warm ceiling lamp',(0,1.30,3.85),(2.1,.20,.10),'light',.035)
box('Rear sign',(0,1.36,3.13),(1.35,.12,.62),'brass',.05)
box('Sign glass',(0,1.282,3.13),(1.18,.035,.47),'trim',.025)
# Geometric numeral 01 in the tiny retro display.
for x,z,w,h in [(-.20,3.28,.21,.035),(-.20,2.99,.21,.035),(-.32,3.13,.035,.3),(-.08,3.13,.035,.3),(.21,3.13,.035,.3)]:box('Amber display',(x,1.25,z),(w,.02,h),'light',.008)
for x in [-1.95,1.95]:tube('Handrail mount',[(x,1.42,1.22),(x,1.20,1.22)],.045,'brass')
tube('Rear handrail',[(-2.10,1.20,1.22),(2.10,1.20,1.22)],.055,'brass')
# Metal fasteners and subtle scars, avoiding noisy texture.
for x in [-2.32,2.32]:
    for z in [.25,3.73]:sphere('Rivet',(x,1.43,z),(.035,.025,.035),'brass')
assets['cabin'],counts['cabin']=export('cabin')
# Individually movable, half-height gate leaves preserve the cutaway view while travelling.
box('Door leaf',(0,0,1.0),(2.48,.13,2.0),'metal',.055)
for x in [-.95,-.48,0,.48,.95]:box('Door groove',(x,-.073,1.0),(.018,.01,1.75),'trim',.005)
box('Door top trim',(0,0,2.01),(2.5,.17,.08),'brass',.025)
assets['door'],counts['door']=export('door')
if not SAMPLE:
    for x,y,z,s in [(0,0,.30,(.72,.64,.58)),(.05,0,.87,(.60,.56,.52))]:
        box('Moving carton',(x,y,z),s,'paper',.035)
        box('Packing tape',(x,y-.5*s[1]-.006,z),(.10,.015,s[2]-.02),'tape',.005)
        box('Top tape',(x,y,z+s[2]/2+.005),(.10,s[1]-.01,.012),'tape',.004)
    assets['cargo'],counts['cargo']=export('cargo')
# Preview only: arrangement, studio lights, and camera are not exported as runtime geometry.
for name,obj in assets.items():
    for part in [obj,*obj.children_recursive]:part.hide_render=name not in ['cabin','student','door']
assets['cabin'].hide_render=False
assets['student'].hide_render=False;assets['student'].location=(-.8,-.45,.09);assets['student'].scale=(1.3,)*3
assets['door'].hide_render=False;assets['door'].location=(-3.8,-1.67,.08)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.32));ground=bpy.context.object;ground.data.materials.append(M['cream'])
world=bpy.context.scene.world;world.color=(.35,.35,.35);world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.62,.60,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5
for loc,power,size in [((1,-6,9),1100,7),((-5,-1,5),700,5),((3,5,7),1100,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(7,-13,10));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=10
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=32;sc.render.resolution_x=1100;sc.render.resolution_y=1100;sc.render.resolution_percentage=100
sc.view_settings.view_transform='AgX';sc.render.filepath=str(ROOT/'style-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'elevator-dolls.blend'))
if '--no-render' not in sys.argv:bpy.ops.render.render(write_still=True)
(ROOT/'asset-manifest.json').write_text(json.dumps({'generator':'Blender Python / original procedural modelling','blender':bpy.app.version_string,'style':'Warm apartment / collectible vinyl dolls','coordinates':'Blender Z up, -Y front; FBX export Y up, -Z forward','animation':'Articulated limb nodes with hip/shoulder origins; runtime walk, turn, settle; not skeletal clips','triangles':counts,'sample':SAMPLE},indent=2))
print('ASSETS_READY',counts)
