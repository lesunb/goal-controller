/**
 * SLEEC's dialect: no definition, no notation. Goal texts give their ids and
 * names only; each kind's properties are its keys, as text.
 */

/** SLEEC's properties, as goal-tree reads them: each key's value is text. */
const texts = <K extends string>(keys: readonly K[]) =>
  keys.map((key) => ({
    key,
    value: { type: 'text' as const },
    help: `its SLEEC ${key}`,
  }));

export const sleec = {
  name: 'SLEEC',
  properties: {
    goal: texts([
      'Type',
      'Source',
      'Class',
      'NormPrinciple',
      'Proxy',
      'AddedValue',
      'Condition',
      'Event',
      'ContextEvent',
    ] as const),
    /**
     * The seeds write `ObstacleEvent` (goal-controller#230); `FluentName`
     * is documentation only.
     */
    task: texts([
      'PreCond',
      'TriggeringEvent',
      'TemporalConstraint',
      'PostCond',
      'ObstacleEvent',
    ] as const),
    /** also in `goal`: examples put NormPrinciple/Proxy on the Quality "Autonomy". */
    quality: texts(['NormPrinciple', 'Proxy'] as const),
  },
};
