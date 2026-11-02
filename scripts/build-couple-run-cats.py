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

# Best gait order per cat (scripts: smallest pose change between steps, frames 3 and 7 dropped — off-cycle).
ORDER={'W':[0,1,2,4,5,6], 'O':[0,1,6,2,4,5]}
PHASE={'W':0,'O':3}   # groom cat half a cycle behind: the two never step in lockstep
N=len(ORDER['W'])
def place(frame,k,f):
    c=cats[k][f]
    s=(np.median(areas[k])/areas[k][f])**0.5*0.86
    c=c.resize((max(1,round(c.width*s)),max(1,round(c.height*s))),Image.LANCZOS)
    a=np.array(c)[...,3]>40
    cy,cx=ndimage.center_of_mass(a)
    ys=np.where(a.any(1))[0]
    frame.alpha_composite(c,(round(anchor[k]-cx),GROUND-(ys.max()+1)))
import cv2
def layer(k,f):
    fr=Image.new('RGBA',(FW,FH),(0,0,0,0)); place(fr,k,f); return np.array(fr).astype(np.float32)/255
def gray(a): return (cv2.cvtColor((a[...,:3]*a[...,3:]*255).astype(np.uint8),cv2.COLOR_RGB2GRAY))
DIS=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
gx,gy=np.meshgrid(np.arange(FW,dtype=np.float32),np.arange(FH,dtype=np.float32))
def warp(a,flow,t):
    pm=a.copy(); pm[...,:3]*=pm[...,3:]
    out=cv2.remap(pm,gx-t*flow[...,0],gy-t*flow[...,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=0)
    return out
def mid(a,b):
    fab=DIS.calc(gray(a),gray(b),None); fba=DIS.calc(gray(b),gray(a),None)
    m=0.5*warp(a,fab,0.5)+0.5*warp(b,fba,0.5)
    al=m[...,3:]; rgb=np.where(al>1e-3,m[...,:3]/np.maximum(al,1e-3),0)
    al=np.where(al>0.5,1.0,al*1.4).clip(0,1)   # keep sprite edges crisp, no ghost halo
    return np.concatenate([rgb,al],-1)
# per cat: 6 keyframes in gait order, plus one in-between after each (the loop seam too) = 12
SEQ={}
for k in ('W','O'):
    keys=[layer(k,f) for f in ORDER[k]]
    seq=[]
    for i,a in enumerate(keys):
        seq += [a, mid(a, keys[(i+1)%len(keys)])]
    SEQ[k]=seq
N=len(SEQ['W']); PHASE={'W':0,'O':N//2}
frames=[]
for t in range(N):
    frame=Image.new('RGBA',(FW,FH),(0,0,0,0))
    for k in ('W','O'):
        a=SEQ[k][(t+PHASE[k])%N]
        frame.alpha_composite(Image.fromarray((a*255).clip(0,255).astype(np.uint8)))
    frames.append(frame)
PAD,GUT=4,8
sheet=Image.new('RGBA',(PAD*2+FW*N+GUT*(N-1), PAD*2+FH),(0,0,0,0))
for i,fr in enumerate(frames): sheet.alpha_composite(fr,(PAD+i*(FW+GUT),PAD))
sheet.save('couple-run.png'); print(sheet.size)
bg=(241,231,211,255)
gif=[Image.alpha_composite(Image.new('RGBA',(FW,FH),bg),fr).convert('P',palette=Image.ADAPTIVE) for fr in frames]
gif[0].save('preview.gif',save_all=True,append_images=gif[1:],duration=53,loop=0,disposal=2)
strip=Image.new('RGBA',(FW*4,FH*3),bg)
for i,fr in enumerate(frames): strip.alpha_composite(fr,((i%4)*FW,(i//4)*FH))
strip.save('strip.png')
