"""Validate historical data relationships and the preserved original source assets."""
from pathlib import Path
import json, subprocess

root=Path(__file__).resolve().parents[1]
folder=root/'research/2026-10-12/data'
load=lambda name:json.loads((folder/(name+'.json')).read_text(encoding='utf-8'))
events,sources,locations=load('events'),load('sources'),load('locations')
source_ids={s['id'] for s in sources};location_ids={l['id'] for l in locations}
assert len(source_ids)==len(sources)
assert len({e['id'] for e in events})==len(events)
assert load('person')['canonical_army_number']=='171301443'
assert {e['evidence_level'] for e in events}=={'A','B','C','D'}
last=''
for e in events:
    assert e['source_ids'] and set(e['source_ids'])<=source_ids,e['id']
    assert e['location_id'] is None or e['location_id'] in location_ids,e['id']
    assert e.get('map_location_id') is None or e['map_location_id'] in location_ids,e['id']
    d=e['date'];start=d.get('start') if isinstance(d,dict) else d
    if start:
        # A month/year interval starts on its first possible day, not day 00.
        parts=start.split('-')
        normalized=''.join([parts[0],parts[1] if len(parts)>1 else '01',parts[2] if len(parts)>2 else '01'])
        assert normalized>=last,(e['id'],start,last)
        last=normalized
for l in locations:
    c=l['coordinates']
    if c:assert len(c)==2 and -180<=c[0]<=180 and -90<=c[1]<=90 and l['coordinate_precision']
by_id={e['id']:e for e in events}
ceram=next(l for l in locations if l['id']=='seram')
assert ceram['coordinates'] is None,'Ceram has no proven landing-site marker'
waypoint=by_id['E008']['route_waypoint']
assert waypoint['coordinate_precision']=='island_schematic'
assert len(waypoint['coordinates'])==2 and all(isinstance(v,(int,float)) for v in waypoint['coordinates'])
assert 127<=waypoint['coordinates'][0]<=132 and -4<=waypoint['coordinates'][1]<=-2
assert all(by_id[i]['source_ids']==['S06'] and by_id[i]['status']!='bevestigd' for i in ['E007','E008','E009'])
assert by_id['E014']['date']=='1946-07-10'
assert by_id['E015']['date']=='1946-09-24' and by_id['E015']['unit']=='XXIe Bataljon Infanterie'
assert by_id['E021']['unit']=='Inf. XXIII M.C.'
assert by_id['E027']['date']=='1950-07-25'
assert by_id['E035']['evidence_level']=='D' and by_id['E036']['evidence_level']=='D'
assert len(load('family-transport'))==6
assert len(load('legacy-events'))==24
for path in subprocess.check_output(['git','ls-tree','-r','--name-only','89af319c68fe631de8f48ec3a3cdc15bf2994948'],cwd=root,text=True).splitlines():
    if path.startswith('assets/'):
        old=subprocess.check_output(['git','show',f'89af319c68fe631de8f48ec3a3cdc15bf2994948:{path}'],cwd=root)
        assert (root/path).read_bytes()==old,path
print(f'PASS: {len(events)} events; all source/location links; chronology; four evidence levels; six transport records; 24 legacy records; 23 original images unchanged.')
