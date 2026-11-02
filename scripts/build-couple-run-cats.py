import numpy as np
from PIL import Image
from scipy import ndimage
SRC=np.array(Image.open(__import__('sys').argv[1]).convert('RGBA'))
im=SRC.astype(int)
mag=(im[...,0]>200)&(im[...,2]>200)&(im[...,1]<80)
band=ndimage.binary_dilation(mag,iterations=3)&~mag
m=np.minimum(im[...,0],im[...,2])-im[...,1]
strong=band&(m>70)
soft=band&(m>28)&~strong
mag=mag|strong
# pull soft fringe toward neutral: cap red/blue at green + 28, keep alpha
for c in (0,2):
    ch=SRC[...,c].astype(int); ch[soft]=np.minimum(ch[soft], im[...,1][soft]+28); SRC[...,c]=ch.astype('uint8')
im=SRC.astype(int)
mask=~mag
lab,n=ndimage.label(mask)
cats={'W':[], 'O':[]}
for f in range(8):
    x0=f*384
    sub=lab[:,x0:x0+384]
    ids=[i for i in np.unique(sub) if i]
    sizes={i:(lab==i).sum() for i in ids}
    big=sorted(ids,key=lambda i:-sizes[i])[:2]
    cents={i:ndimage.center_of_mass(lab==i) for i in big}
    groups={i:(lab==i) for i in big}
    for i in ids:
        if i in big: continue
        cy,cx=ndimage.center_of_mass(lab==i)
        near=min(big,key=lambda b:abs(cents[b][1]-cx))
        groups[near]|=(lab==i)
    for b in big:
        m=groups[b]; ys,xs=np.where(m)
        col=im[ys,xs,:3].mean()
        key='W' if col>200 else 'O'
        crop=SRC[ys.min():ys.max()+1, xs.min():xs.max()+1].copy()
        cm=m[ys.min():ys.max()+1, xs.min():xs.max()+1]
        crop[~cm]=0
        cats[key].append(Image.fromarray(crop))
areas={k:[(np.array(c)[...,3]>0).sum() for c in v] for k,v in cats.items()}
FW,FH,GROUND=384,224,214
anchor={'W':104,'O':282}   # body centroid x per cat inside a frame
frames=[]
for f in range(8):
    frame=Image.new('RGBA',(FW,FH),(0,0,0,0))
    for k in ('W','O'):
        c=cats[k][f]
        s=(np.median(areas[k])/areas[k][f])**0.5*0.86
        c=c.resize((max(1,round(c.width*s)),max(1,round(c.height*s))),Image.LANCZOS)
        a=np.array(c)[...,3]>40
        cy,cx=ndimage.center_of_mass(a)
        ys=np.where(a.any(1))[0]
        x=round(anchor[k]-cx); y=GROUND-(ys.max()+1)
        frame.alpha_composite(c,(x,y))
    frames.append(frame)
PAD,GUT=4,8
sheet=Image.new('RGBA',(PAD*2+FW*8+GUT*7, PAD*2+FH),(0,0,0,0))
for i,fr in enumerate(frames): sheet.alpha_composite(fr,(PAD+i*(FW+GUT),PAD))
sheet.save('couple-run.png'); print(sheet.size)
# previews
bg=(241,231,211,255)
gif=[Image.alpha_composite(Image.new('RGBA',(FW,FH),bg),fr).convert('P',palette=Image.ADAPTIVE) for fr in frames]
gif[0].save('preview.gif',save_all=True,append_images=gif[1:],duration=80,loop=0,disposal=2)
# onion-skin check: all frames overlaid at 25%
on=Image.new('RGBA',(FW,FH),bg)
for fr in frames:
    a=np.array(fr); a[...,3]=(a[...,3]*0.22).astype('uint8'); on.alpha_composite(Image.fromarray(a))
on.save('onion.png')
strip=Image.new('RGBA',(FW*4,FH*2),bg)
for i,fr in enumerate(frames): strip.alpha_composite(fr,((i%4)*FW,(i//4)*FH))
strip.save('strip.png')
