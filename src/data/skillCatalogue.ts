import type { SkillDefinition, SkillCategory } from '../types';

/**
 * Reusable local skill catalogue for eFootball skills.
 * Maintained independently from UI components.
 */
export const SKILL_CATALOGUE: readonly SkillDefinition[] = [
  // ── Shooting ──────────────────────────────────────────────────────────────
  {
    id: 'heading',
    name: 'Heading',
    category: 'Shooting',
    description: 'Enables players to head the ball with increased accuracy, power, and downward trajectory.',
  },
  {
    id: 'long-range-curler',
    name: 'Long-range Curler',
    category: 'Shooting',
    description: 'Enables players to hit curling shots with great accuracy from a distance outside the box.',
  },
  {
    id: 'long-range-shooting',
    name: 'Long-range Shooting',
    category: 'Shooting',
    description: 'Enables players to hit accurate, powerful long-range shots from outside the penalty area.',
  },
  {
    id: 'acrobatic-finishing',
    name: 'Acrobatic Finishing',
    category: 'Shooting',
    description: 'Enables players to execute acrobatic volleys, diving headers, and shots from awkward body positions.',
  },
  {
    id: 'first-time-shot',
    name: 'First-time Shot',
    category: 'Shooting',
    description: 'Improves technique, composure, and accuracy when striking the ball cleanly on the first touch.',
  },
  {
    id: 'rising-shot',
    name: 'Rising Shot',
    category: 'Shooting',
    description: 'Enables players to unleash shots that rise sharply into the roof of the net.',
  },
  {
    id: 'dipping-shot',
    name: 'Dipping Shot',
    category: 'Shooting',
    description: 'Enables players to take dipping shots that drop suddenly right before reaching the goalkeeper.',
  },
  {
    id: 'knuckle-shot',
    name: 'Knuckle Shot',
    category: 'Shooting',
    description: 'Enables unpredictable knuckleball trajectories that fluctuate and swerve mid-flight.',
  },
  {
    id: 'chip-shot-control',
    name: 'Chip Shot Control',
    category: 'Shooting',
    description: 'Enables players to perform precise, delicate chipped finishes over rushing goalkeepers.',
  },
  {
    id: 'phenomenal-finishing',
    name: 'Phenomenal Finishing',
    category: 'Shooting',
    description: 'Special shooting technique delivering powerful, accurate strikes even when off-balance.',
  },
  {
    id: 'blitz-curler',
    name: 'Blitz Curler',
    category: 'Shooting',
    description: 'Special curler with high spin and sharp dip, generating unstoppable dipping arcs from distance.',
  },
  {
    id: 'bullet-header',
    name: 'Bullet Header',
    category: 'Shooting',
    description: 'Dramatically increases header exit velocity and sharp downward trajectory on target.',
  },
  {
    id: 'penalty-specialist',
    name: 'Penalty Specialist',
    category: 'Shooting',
    description: 'Improves accuracy, composure, and placement when executing penalty kicks.',
  },
  {
    id: 'low-screamer',
    name: 'Low Screamer',
    category: 'Shooting',
    description: 'Strikes low, driven shots along the turf with devastating speed and precision.',
  },

  // ── Passing ───────────────────────────────────────────────────────────────
  {
    id: 'one-touch-pass',
    name: 'One-touch Pass',
    category: 'Passing',
    description: 'Improves pass accuracy, speed, and fluid release on the first touch.',
  },
  {
    id: 'through-passing',
    name: 'Through Passing',
    category: 'Passing',
    description: 'Increases accuracy and weighted trajectory of through passes behind defensive lines.',
  },
  {
    id: 'weighted-pass',
    name: 'Weighted Pass',
    category: 'Passing',
    description: 'Adds ideal backspin to lofted through passes to ensure the ball lands softly in space.',
  },
  {
    id: 'pinpoint-crossing',
    name: 'Pinpoint Crossing',
    category: 'Passing',
    description: 'Enables players to deliver curled, whipped crosses with supreme accuracy from wide areas.',
  },
  {
    id: 'outside-curler',
    name: 'Outside Curler',
    category: 'Passing',
    description: 'Enables players to curl passes and shots with the outside of their stronger foot.',
  },
  {
    id: 'low-lofted-pass',
    name: 'Low Lofted Pass',
    category: 'Passing',
    description: 'Enables low-trajectory, rapid lofted passes that bypass intermediate defensive markers.',
  },
  {
    id: 'visionary-pass',
    name: 'Visionary Pass',
    category: 'Passing',
    description: 'Special passing technique that increases through-ball incisiveness and teammate acceleration.',
  },
  {
    id: 'edged-crossing',
    name: 'Edged Crossing',
    category: 'Passing',
    description: 'Special wide delivery whipping fast, sharp dipping crosses with maximum curve into dangerous areas.',
  },
  {
    id: 'phenomenal-pass',
    name: 'Phenomenal Pass',
    category: 'Passing',
    description: 'Delivers perfectly placed passes from contorted body angles or under intense pressing.',
  },
  {
    id: 'no-look-pass',
    name: 'No Look Pass',
    category: 'Passing',
    description: 'Executes deceptive passes while looking in a different direction to misdirect opponents.',
  },

  // ── Dribbling ─────────────────────────────────────────────────────────────
  {
    id: 'double-touch',
    name: 'Double Touch',
    category: 'Dribbling',
    description: 'Enables the signature rapid body-feint and double-touch sidestep move past challenging defenders.',
  },
  {
    id: 'flip-flap',
    name: 'Flip Flap',
    category: 'Dribbling',
    description: 'Enables the rapid elastico skill move to wrongfoot defenders in tight 1-on-1 situations.',
  },
  {
    id: 'marseille-turn',
    name: 'Marseille Turn',
    category: 'Dribbling',
    description: 'Enables the 360-degree roulette turn to spin through challenging defenders.',
  },
  {
    id: 'sole-control',
    name: 'Sole Control',
    category: 'Dribbling',
    description: 'Improves step-on ball rolling, drag-backs, and tight-space close control with the sole.',
  },
  {
    id: 'scissors-feint',
    name: 'Scissors Feint',
    category: 'Dribbling',
    description: 'Enables rapid stepover feints at high sprint speed to destabilize defending markers.',
  },
  {
    id: 'chop-turn',
    name: 'Chop Turn',
    category: 'Dribbling',
    description: 'Enables sharp lateral cuts behind the standing leg to change attack angles instantly.',
  },
  {
    id: 'cut-behind-and-turn',
    name: 'Cut Behind & Turn',
    category: 'Dribbling',
    description: 'Enables swift turns by cutting the ball cleanly behind the standing leg.',
  },
  {
    id: 'heel-trick',
    name: 'Heel Trick',
    category: 'Dribbling',
    description: 'Enables flicked passes and shots with the heel when facing away from the target.',
  },
  {
    id: 'momentum-dribbling',
    name: 'Momentum Dribbling',
    category: 'Dribbling',
    description: 'Special skill that accelerates explosive bursts and agility right out of a dribbling maneuver.',
  },
  {
    id: 'magnetic-feet',
    name: 'Magnetic Feet',
    category: 'Dribbling',
    description: 'Glues the ball to the player feet, ensuring superb retention even under dense defensive pressure.',
  },
  {
    id: 'acceleration-burst',
    name: 'Acceleration Burst',
    category: 'Dribbling',
    description: 'Provides an instantaneous speed burst when shifting from steady dribble to full sprint.',
  },
  {
    id: 'tap-trick',
    name: 'Tap Trick',
    category: 'Dribbling',
    description: 'Executes rapid toe-pokes and micro-touches to maintain control through congested boxes.',
  },

  // ── Defending ─────────────────────────────────────────────────────────────
  {
    id: 'man-marking',
    name: 'Man Marking',
    category: 'Defending',
    description: 'Enables tighter, more relentless stick-tight marking of designated opposing attackers.',
  },
  {
    id: 'interception',
    name: 'Interception',
    category: 'Defending',
    description: 'Improves defensive awareness, positioning, and reach to cut out opposition passes.',
  },
  {
    id: 'blocker',
    name: 'Blocker',
    category: 'Defending',
    description: 'Increases chances and agility to block opposing shots, crosses, and through balls.',
  },
  {
    id: 'aerial-superiority',
    name: 'Aerial Superiority',
    category: 'Defending',
    description: 'Enhances jump timing, body balance, and success rate in contested aerial duels.',
  },
  {
    id: 'sliding-tackle',
    name: 'Sliding Tackle',
    category: 'Defending',
    description: 'Increases reach, precision, and clean ball recovery of sliding tackles without fouling.',
  },
  {
    id: 'fortress',
    name: 'Fortress',
    category: 'Defending',
    description: 'Special booster skill providing an ironclad boost to defensive blocking and positioning.',
  },
  {
    id: 'long-reach-tackle',
    name: 'Long-reach Tackle',
    category: 'Defending',
    description: 'Extends leg reach to cleanly dispossess attackers from recovery angles.',
  },
  {
    id: 'shadow-hunt',
    name: 'Shadow Hunt',
    category: 'Defending',
    description: 'Relentlessly tracks and press-shields opponents to force turnovers and errors.',
  },
  {
    id: 'acrobatic-clearance',
    name: 'Acrobatic Clearance',
    category: 'Defending',
    description: 'Enables defenders to clear the ball with acrobatic overhead kicks and awkward volleys.',
  },
  {
    id: 'aerial-fort',
    name: 'Aerial Fort',
    category: 'Defending',
    description: 'Special commanding skill that dominates aerial battles inside the penalty area.',
  },

  // ── Goalkeeping ───────────────────────────────────────────────────────────
  {
    id: 'gk-high-punt',
    name: 'GK High Punt',
    category: 'Goalkeeping',
    description: 'Enables goalkeepers to punt high balls deep into the opposition defensive third.',
  },
  {
    id: 'gk-low-punt',
    name: 'GK Low Punt',
    category: 'Goalkeeping',
    description: 'Enables goalkeepers to hit flat, driven punts with rapid trajectory to launch quick counter-attacks.',
  },
  {
    id: 'gk-long-throw',
    name: 'GK Long Throw',
    category: 'Goalkeeping',
    description: 'Increases reach, speed, and accuracy of overarm throws to wide counter-attacking runners.',
  },
  {
    id: 'gk-penalty-saver',
    name: 'GK Penalty Saver',
    category: 'Goalkeeping',
    description: 'Improves reaction time, anticipation, and diving reach to stop penalty kicks.',
  },

  // ── Physical & Mental ─────────────────────────────────────────────────────
  {
    id: 'fighting-spirit',
    name: 'Fighting Spirit',
    category: 'Physical & Mental',
    description: 'Enables players to maintain performance and stamina when under pressure, fatigued, or trailing.',
  },
  {
    id: 'super-sub',
    name: 'Super-sub',
    category: 'Physical & Mental',
    description: 'Boosts player attributes and sharpness when brought on as a substitute in the second half.',
  },
  {
    id: 'captaincy',
    name: 'Captaincy',
    category: 'Physical & Mental',
    description: 'Inspires teammates on the pitch and reduces squad-wide stamina exhaustion as designated captain.',
  },
  {
    id: 'track-back',
    name: 'Track Back',
    category: 'Physical & Mental',
    description: 'Drives offensive and wide players to aggressively track back and press when possession is lost.',
  },
  {
    id: 'gamesmanship',
    name: 'Gamesmanship',
    category: 'Physical & Mental',
    description: 'Enables players to draw tactical fouls from defenders in dangerous attacking zones.',
  },
  {
    id: 'willpower',
    name: 'Willpower',
    category: 'Physical & Mental',
    description: 'Bolsters composure, stamina recovery, and physical grit during the closing stages of matches.',
  },
  {
    id: 'attacking-surge',
    name: 'Attacking Surge',
    category: 'Physical & Mental',
    description: 'Special trait delivering sustained forward momentum and attacking positioning during attacks.',
  },
  {
    id: 'attack-trigger',
    name: 'Attack Trigger',
    category: 'Physical & Mental',
    description: 'Triggers rapid vertical sprint transitions upon team turnover to exploit opposing transition gaps.',
  },
  {
    id: 'trending-card',
    name: 'Trending Card',
    category: 'Physical & Mental',
    description: 'Featured card status with specialized condition rating boost in competitive matches.',
  },
] as const;

export const ALL_SKILL_CATEGORIES: readonly SkillCategory[] = [
  'Shooting',
  'Passing',
  'Dribbling',
  'Defending',
  'Goalkeeping',
  'Physical & Mental',
] as const;

/**
 * Returns all skills in the catalogue
 */
export function getAllSkills(): readonly SkillDefinition[] {
  return SKILL_CATALOGUE;
}

/**
 * Returns skills belonging to a specific category
 */
export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
  return SKILL_CATALOGUE.filter((s) => s.category === category);
}

/**
 * Lookup a skill by exact or normalized name
 */
export function getSkillByName(name: string): SkillDefinition | undefined {
  const normalized = name.trim().toLowerCase();
  return SKILL_CATALOGUE.find((s) => s.name.toLowerCase() === normalized);
}

/**
 * Filter skills by search query and optional category
 */
export function searchSkills(
  query: string,
  category: SkillCategory | 'All' = 'All'
): SkillDefinition[] {
  const q = query.trim().toLowerCase();
  return SKILL_CATALOGUE.filter((skill) => {
    if (category !== 'All' && skill.category !== category) {
      return false;
    }
    if (!q) return true;
    return (
      skill.name.toLowerCase().includes(q) ||
      skill.category.toLowerCase().includes(q) ||
      skill.description.toLowerCase().includes(q)
    );
  });
}
