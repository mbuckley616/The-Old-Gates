# python3 docs/prototypes/aurenne/build.py — copies SK (js/32-people.js) and mergeParts (js/80-world-terrain.js) into kit.js
import os
here=os.path.dirname(os.path.abspath(__file__));root=os.path.join(here,'..','..','..')
def grab(path,start):
    s=open(os.path.join(root,path),encoding='utf-8').read();i=s.index(start);j=s.index('{',i);d=0
    for k in range(j,len(s)):
        if s[k]=='{':d+=1
        elif s[k]=='}':
            d-=1
            if d==0:return s[i:k+1]
out=("// the game's own shape kit (js/32-people.js) and part merge (js/80-world-terrain.js), copied by build.py so the\n"
     "// prototype draws with what the builder will use. mergeParts is called with no AO here (the game passes HAO).\n"
     +grab('js/32-people.js','const SK={')+';\n'+grab('js/80-world-terrain.js','function mergeParts(')+'\n')
open(os.path.join(here,'kit.js'),'w',encoding='utf-8').write(out);print('kit.js',len(out))
