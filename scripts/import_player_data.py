#!/usr/bin/env python3
"""
scripts/import_player_data.py
Repeatable ingestion script to extract player data from Bala_EFoot_Player_Data_Template_v1.xlsx
and write structured, strongly-typed JSON to src/data/players.json.

Preserves data provenance, does not invent missing values, and leaves unverified fields as null.
"""

import json
import os
import sys
import xml.etree.ElementTree as ET
import zipfile

WORKBOOK_PATH = 'data/Bala_EFoot_Player_Data_Template_v1.xlsx'
OUTPUT_JSON_PATH = 'src/data/players.json'

def get_cell_value(c, ns, shared_strings):
    t = c.attrib.get('t')
    if t == 'inlineStr':
        t_elem = c.find('.//main:is/main:t', ns)
        return t_elem.text if t_elem is not None else ''
    v_elem = c.find('.//main:v', ns)
    if v_elem is None or v_elem.text is None:
        return None
    val = v_elem.text
    if t == 's':
        idx = int(val)
        return shared_strings[idx] if idx < len(shared_strings) else val
    return val

def parse_sheet_rows(z, target_path, ns, shared_strings, header_row_idx=2):
    sheet_tree = ET.fromstring(z.read(target_path))
    rows = sheet_tree.findall('.//main:row', ns)
    if len(rows) <= header_row_idx:
        return []
    
    h_row = rows[header_row_idx]
    cols = {}
    for c in h_row.findall('.//main:c', ns):
        col_letter = ''.join(ch for ch in c.attrib['r'] if ch.isalpha())
        cols[col_letter] = get_cell_value(c, ns, shared_strings)
        
    data = []
    for r in rows[header_row_idx + 1:]:
        row_dict = {}
        for c in r.findall('.//main:c', ns):
            col_letter = ''.join(ch for ch in c.attrib['r'] if ch.isalpha())
            val = get_cell_value(c, ns, shared_strings)
            if val is not None and str(val).strip() != '':
                row_dict[cols.get(col_letter, col_letter)] = str(val).strip()
        if row_dict:
            data.append(row_dict)
    return data

def to_int_or_none(val):
    if val is None or val == '':
        return None
    try:
        return int(float(val))
    except ValueError:
        return None

def to_float_or_none(val):
    if val is None or val == '':
        return None
    try:
        return float(val)
    except ValueError:
        return None

def main():
    if not os.path.exists(WORKBOOK_PATH):
        print(f"Error: workbook {WORKBOOK_PATH} not found.", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(WORKBOOK_PATH) as z:
        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_map = {r.attrib['Id']: r.attrib['Target'].lstrip('/') for r in rels_tree}
        
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns_ss = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in ss_tree.findall('.//main:si', ns_ss):
                t_elems = si.findall('.//main:t', ns_ss)
                shared_strings.append(''.join(t.text or '' for t in t_elems))
                
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        sheets = {
            s.attrib['name']: rel_map[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            for s in wb_tree.findall('.//main:sheet', ns)
        }

        raw_players = parse_sheet_rows(z, sheets['Players'], ns, shared_strings, 2)
        raw_attributes = parse_sheet_rows(z, sheets['Player Attributes'], ns, shared_strings, 2)
        raw_skills = parse_sheet_rows(z, sheets['Player Skills'], ns, shared_strings, 2)
        raw_model = parse_sheet_rows(z, sheets['Player Model'], ns, shared_strings, 2)
        raw_overall = parse_sheet_rows(z, sheets['Overall Performance'], ns, shared_strings, 2)

    attr_by_id = {row['Player ID']: row for row in raw_attributes if 'Player ID' in row}
    model_by_id = {row['Player ID']: row for row in raw_model if 'Player ID' in row}
    perf_by_id = {row['Player ID']: row for row in raw_overall if 'Player ID' in row}

    skills_by_id = {}
    for row in raw_skills:
        pid = row.get('Player ID')
        if not pid:
            continue
        skills_by_id.setdefault(pid, []).append({
            'skillName': row.get('Skill Name'),
            'skillType': row.get('Skill Type', 'Default'),
            'isHighlightGold': row.get('Highlight Gold?', 'No').lower() == 'yes',
            'isVerified': row.get('Verified Against Card?', 'No').lower() == 'yes',
            'notes': row.get('Source / Notes') or None
        })

    compiled_players = []
    for rp in raw_players:
        pid = rp.get('Player ID')
        if not pid:
            continue
        
        name = rp.get('Player Name', '')
        card_name = rp.get('Card / Version Name') or None
        overall_rating = to_int_or_none(rp.get('Overall Rating'))
        card_type = rp.get('Card Type / Rarity') or None
        primary_pos = rp.get('Natural / Main Position', '')
        other_pos_str = rp.get('Other Positions') or ''
        other_positions = [p.strip() for p in other_pos_str.split(',') if p.strip()] if other_pos_str else []
        squad_pos = rp.get('Current Squad Position') or None
        playing_style = rp.get('Playing Style') or 'None'
        preferred_foot = rp.get('Preferred Foot') or None
        club = rp.get('Club / Team') or None
        nationality = rp.get('Nationality') or None
        height = to_int_or_none(rp.get('Height (cm)'))
        weight = to_int_or_none(rp.get('Weight (kg)'))
        age = to_int_or_none(rp.get('Age (as shown)'))
        image_url = rp.get('Card Image URL / Filename') or None
        in_starting_xi = rp.get('In Starting XI?', 'No').lower() == 'yes'
        in_subs = rp.get('In Substitutes?', 'No').lower() == 'yes'
        is_acquired = rp.get('Card Acquired?', 'Yes').lower() == 'yes'
        booster = rp.get('Booster / Special Ability') or None
        manager_notes = rp.get('Manager / Team Notes') or None
        general_notes = rp.get('General Notes') or None
        efhub_url = rp.get('eFHUB URL') or None

        ra = attr_by_id.get(pid, {})
        rm = model_by_id.get(pid, {})
        ro = perf_by_id.get(pid, {})

        # Attacking attributes
        attacking = {
            'offensiveAwareness': to_int_or_none(ra.get('Offensive Awareness')),
            'ballControl': to_int_or_none(ra.get('Ball Control')),
            'dribbling': to_int_or_none(ra.get('Dribbling')),
            'tightPossession': to_int_or_none(ra.get('Tight Possession')),
            'lowPass': to_int_or_none(ra.get('Low Pass')),
            'loftedPass': to_int_or_none(ra.get('Lofted Pass')),
            'finishing': to_int_or_none(ra.get('Finishing')),
            'heading': to_int_or_none(ra.get('Heading')),
            'setPieceTaking': to_int_or_none(ra.get('Set Piece Taking')),
            'curl': to_int_or_none(ra.get('Curl')),
            'weakFootUsage': ra.get('Weak Foot Usage') or None,
            'weakFootAccuracy': ra.get('Weak Foot Accuracy') or None,
        }

        # Goalkeeper attributes (applicable if GK)
        gk = {
            'gkAwareness': to_int_or_none(ra.get('GK Awareness')),
            'gkCatching': to_int_or_none(ra.get('GK Catching')),
            'gkParrying': to_int_or_none(ra.get('GK Parrying')),
            'gkReflexes': to_int_or_none(ra.get('GK Reflexes')),
            'gkReach': to_int_or_none(ra.get('GK Reach')),
            'gkClearing': to_int_or_none(ra.get('GK Clearing')),
        }

        # Defending attributes
        defending = {
            'defensiveAwareness': to_int_or_none(ra.get('Defensive Awareness')),
            'ballWinning': to_int_or_none(ra.get('Ball Winning')),
            'aggression': to_int_or_none(ra.get('Aggression')),
            'defensiveEngagement': to_int_or_none(ra.get('Defensive Engagement')),
        }

        # Athleticism attributes
        athleticism = {
            'speed': to_int_or_none(ra.get('Speed')),
            'acceleration': to_int_or_none(ra.get('Acceleration')),
            'kickingPower': to_int_or_none(ra.get('Kicking Power')),
            'jump': to_int_or_none(ra.get('Jump')),
            'physicalContact': to_int_or_none(ra.get('Physical Contact')),
            'balance': to_int_or_none(ra.get('Balance')),
            'stamina': to_int_or_none(ra.get('Stamina')),
            'form': ra.get('Form') or None,
            'injuryResistance': ra.get('Injury Resistance') or None,
        }

        # Player Model attributes
        player_model = {
            'heightCm': height,
            'weightKg': weight,
            'armLength': to_int_or_none(rm.get('Arm Length')),
            'shoulderWidth': to_int_or_none(rm.get('Shoulder Width')),
            'neckLength': to_int_or_none(rm.get('Neck Length')),
            'chestMeasurement': to_int_or_none(rm.get('Chest Measurement')),
            'neckSize': to_int_or_none(rm.get('Neck Size')),
            'shoulderHeight': to_int_or_none(rm.get('Shoulder Height')),
            'legLength': to_int_or_none(rm.get('Leg Length')),
            'thighSize': to_int_or_none(rm.get('Thigh Size')),
            'waistSize': to_int_or_none(rm.get('Waist Size')),
            'armSize': to_int_or_none(rm.get('Arm Size')),
            'calfSize': to_int_or_none(rm.get('Calf Size')),
            'sourceValidation': rm.get('Source / Validation') or None,
        }

        # Overall performance
        overall_perf = {
            'matchesPlayed': to_int_or_none(ro.get('Matches Played')),
            'goals': to_int_or_none(ro.get('Goals')),
            'assists': to_int_or_none(ro.get('Assists')),
            'cleanSheets': to_int_or_none(ro.get('Clean Sheets (if relevant)')),
            'goalContributions': to_int_or_none(ro.get('Goal Contributions')),
            'goalsPerMatch': to_float_or_none(ro.get('Goals / Match')),
            'assistsPerMatch': to_float_or_none(ro.get('Assists / Match')),
            'notes': ro.get('Notes') or None,
        }

        compiled_players.append({
            'id': pid,
            'name': name,
            'cardName': card_name,
            'overallRating': overall_rating,
            'cardType': card_type,
            'primaryPosition': primary_pos,
            'secondaryPositions': other_positions,
            'squadPosition': squad_pos,
            'playingStyle': playing_style,
            'preferredFoot': preferred_foot,
            'club': club,
            'nationality': nationality,
            'heightCm': height,
            'weightKg': weight,
            'age': age,
            'imageUrl': image_url,
            'inStartingXI': in_starting_xi,
            'inSubstitutes': in_subs,
            'isAcquired': is_acquired,
            'booster': booster,
            'managerNotes': manager_notes,
            'generalNotes': general_notes,
            'efhubUrl': efhub_url,
            'provenance': {
                'source': 'Bala_EFoot_Player_Data_Template_v1.xlsx',
                'attributeNotes': ra.get('Notes') or None,
                'additionalBoosterNotes': ra.get('Additional / Booster Attributes') or None,
                'isVerified': False,
            },
            'attributes': {
                'attacking': attacking,
                'goalkeeping': gk if primary_pos == 'GK' else None,
                'defending': defending,
                'athleticism': athleticism,
                'playerModel': player_model,
            },
            'skills': skills_by_id.get(pid, []),
            'overallPerformance': overall_perf,
        })

    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
    with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(compiled_players, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(compiled_players)} players from {WORKBOOK_PATH} -> {OUTPUT_JSON_PATH}")

if __name__ == '__main__':
    main()
