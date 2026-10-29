"""Pixelize the approved follower concept (AI-assisted, 'ภาพ 3') into a chunky atlas."""
from PIL import Image; import numpy as np
from collections import deque
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'vendor/concepts/followers-concept.jpg'
im=np.array(Image.open(SRC).convert('RGB')).astype(int)
P=8; GUT=2
m=im.max(2)>40
cols=np.where(m.any(0))[0]; rows=np.where(m.any(1))[0]
top,bot=rows.min(),rows.max()+1
segs=[];s=cols[0];p=s
for c in cols[1:]:
    if c>p+5: segs.append((s,p+1)); s=c
    p=c
segs.append((s,p+1))
tiles=[]
for x0,x1 in segs:
    w=round((x1-x0)/P); h=round((bot-top)/P)
    t=np.zeros((h,w,4),np.uint8)
    for j in range(h):
        for i in range(w):
            blk=im[top+j*P+2:top+j*P+P-2, x0+i*P+2:x0+i*P+P-2].reshape(-1,3)
            t[j,i,:3]=np.median(blk,0); t[j,i,3]=255
    # flood-fill near-black background from the border
    dark=t[...,:3].max(2)<30; seen=np.zeros_like(dark); q=deque()
    for j in range(h):
        for i in range(w):
            if (j in(0,h-1) or i in(0,w-1)) and dark[j,i]: q.append((j,i)); seen[j,i]=1
    while q:
        j,i=q.popleft(); t[j,i,3]=0
        for dj,di in((1,0),(-1,0),(0,1),(0,-1)):
            a,b=j+dj,i+di
            if 0<=a<h and 0<=b<w and dark[a,b] and not seen[a,b]: seen[a,b]=1; q.append((a,b))
    img=Image.fromarray(t); bb=img.getbbox(); tiles.append(img.crop(bb))
fw=max(t.size[0] for t in tiles)+2*GUT; fh=max(t.size[1] for t in tiles)+GUT
sheet=Image.new('RGBA',(fw*len(tiles),fh),(0,0,0,0))
for k,t in enumerate(tiles):
    sheet.paste(t,(k*fw+(fw-t.size[0])//2, fh-t.size[1]),t)
a=sheet.getchannel('A'); sheet=sheet.convert('RGB').quantize(20,method=Image.Quantize.MEDIANCUT).convert('RGBA'); sheet.putalpha(a)
sheet.save(ROOT/'public/sprites/followers.png'); print('frame',fw,fh,'count',len(tiles),'sheet',sheet.size,[t.size for t in tiles])
bg=Image.new('RGBA',sheet.size,(40,36,52,255)); bg.alpha_composite(sheet)
bg.resize((sheet.size[0]*8,sheet.size[1]*8),Image.NEAREST).save('/tmp/followers-preview.png')
