from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
root=Path(__file__).resolve().parent.parent
errors=[];refs=0
class Check(HTMLParser):
 def __init__(self,p):super().__init__();self.p=p;self.ids=set();self.dupes=[];self.h1=0;self.lang=None
 def handle_starttag(self,tag,attrs):
  global refs
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang')
  if tag=='h1':self.h1+=1
  if 'id' in a:
   if a['id'] in self.ids:self.dupes.append(a['id'])
   self.ids.add(a['id'])
  if tag=='img' and not a.get('alt'):errors.append(f'{self.p.name}: image without alt')
  for k in ['src','href','srcset']:
   v=a.get(k,'')
   if not v or v.startswith('#') or urlsplit(v).scheme:continue
   target=(self.p.parent/unquote(urlsplit(v.split()[0]).path)).resolve();refs+=1
   if not target.is_file():errors.append(f'{self.p.relative_to(root)}: missing {v}')
for p in root.rglob('*.html'):
 c=Check(p);c.feed(p.read_text())
 if c.h1!=1:errors.append(f'{p}: {c.h1} h1 headings')
 if c.lang not in ['mk','en']:errors.append(f'{p}: missing language')
 if c.dupes:errors.append(f'{p}: duplicate IDs {c.dupes}')
print(f'Checked {len(list(root.rglob("*.html")))} HTML pages, {refs} local references; {len(errors)} errors')
print('\n'.join(errors))
raise SystemExit(bool(errors))
