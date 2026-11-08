#!/usr/bin/env python3
"""Package the tested Creator Web build for Vercel Build Output API v3."""
from pathlib import Path
import shutil,json,hashlib
root=Path(__file__).resolve().parents[1]
source=root/'cocos/build/web'
assert (source/'index.html').exists(), 'Build Cocos Web first'
release=root/'release'
out=release/'.vercel/output'
if out.exists(): shutil.rmtree(out)
shutil.copytree(source,out/'static')
index=out/'static/index.html'
index.write_text(index.read_text().replace('Cocos Creator | ElevatorAgain','电梯再等一个 · 玩偶公寓'))
(out/'config.json').write_text(json.dumps({'version':3,'routes':[{'src':'/','headers':{'Cache-Control':'public, max-age=0, must-revalidate'},'continue':True}]}))
(release/'.vercel/project.json').write_text(json.dumps({'projectId':'prj_LfAnhNzdywtIam3rMkIjt5poLQGr','orgId':'team_YRfyw8UPP66meXkCLQz7P1lE','projectName':'elevator-puzzle'}))
(release/'vercel.json').write_text(json.dumps({'framework':None,'buildCommand':None,'installCommand':None,'outputDirectory':None}))
manifest={str(p.relative_to(out/'static')):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((out/'static').rglob('*')) if p.is_file()}
(root/'docs/release-manifest.json').write_text(json.dumps(manifest,indent=2))
print(f'Packaged {len(manifest)} files in {release}')
