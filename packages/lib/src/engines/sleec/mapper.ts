/**
 * SLEEC Engine Mapper
 * Maps raw iStar model properties to SLEEC engine-specific properties
 */
import {
  createEngineMapper,
  useIstarDefaultNaming,
  type NodeOf,
} from '@goal-controller/goal-tree';

/**
 * Allowed keys for SLEEC goal custom properties
 */
export const SLEEC_GOAL_KEYS = [
  'Type',
  'Source',
  'Class',
  'NormPrinciple',
  'Proxy',
  'AddedValue',
  'Condition',
  'Event',
  'ContextEvent',
] as const;

/**
 * Allowed keys for SLEEC task custom properties. The seeds write
 * `ObstacleEvent` (goal-controller#230); `FluentName` is documentation only.
 */
export const SLEEC_TASK_KEYS = [
  'PreCond',
  'TriggeringEvent',
  'TemporalConstraint',
  'PostCond',
  'ObstacleEvent',
] as const;

/**
 * Allowed keys for SLEEC Quality custom properties (also in SLEEC_GOAL_KEYS).
 * Examples put NormPrinciple/Proxy on the Quality "Autonomy".
 */
export const SLEEC_QUALITY_KEYS = ['NormPrinciple', 'Proxy'] as const;

/** SLEEC's properties, as goal-tree reads them: each key's value is text. */
const texts = <K extends string>(keys: readonly K[]) =>
  keys.map((key) => ({
    key,
    value: { type: 'text' as const },
    help: `its SLEEC ${key}`,
  }));

// Type aliases for the allowed keys
export type SleecGoalKey = (typeof SLEEC_GOAL_KEYS)[number];
export type SleecTaskKey = (typeof SLEEC_TASK_KEYS)[number];
export type SleecQualityKey = (typeof SLEEC_QUALITY_KEYS)[number];

/** An object with only the given keys, each optional. */
type OptionalProps<K extends string> = { [P in K]?: string };

/** An object with only the given keys, each required. */
type RequiredProps<K extends string> = { [P in K]: string };

/** A SLEEC element's properties as the mapper is given them: each `text`. */
type SleecProps<K extends string> = {
  props: { [P in K]?: string | null };
  raw: { [P in K]?: string };
};

/**
 * The keys set, each as written: a key whose `text` reads as unset (empty
 * or blank) is left out, and the others keep their text untrimmed, as the
 * specification has always been given them. `R` is the record's own key
 * range; `K`, the (possibly narrower) keys asked for, is what the result is
 * typed by.
 */
export const written = <R extends string, K extends R>(
  { props, raw }: SleecProps<R>,
  keys: readonly K[],
): OptionalProps<K> => {
  const values: OptionalProps<K> = {};
  for (const key of keys) {
    const value = props[key] == null ? undefined : raw[key];
    if (value !== undefined) values[key] = value;
  }
  return values;
};

/**
 * The keys set, each required: throws for a record missing one of `keys`.
 */
const required = <R extends string, K extends R>(
  record: SleecProps<R>,
  keys: readonly K[],
  taskName: string,
): RequiredProps<K> => {
  const values = written(record, keys);
  const missing = keys.filter((key) => !(key in values));
  if (missing.length > 0) {
    throw new Error(
      `Task "${taskName}" is missing required SLEEC properties: ${missing.join(', ')}. ` +
        `All tasks must define: ${keys.join(', ')}.`,
    );
  }
  return values as RequiredProps<K>;
};

const REQUIRED_TASK_KEYS = [
  'PreCond',
  'TriggeringEvent',
  'PostCond',
  'TemporalConstraint',
] as const;

export type RequiredTaskKey = (typeof REQUIRED_TASK_KEYS)[number];

/** Each SLEEC goal (and Quality) key, optional. */
export type SleecGoalProps = OptionalProps<SleecGoalKey>;

/** A task's properties: the mapper throws for a task missing one of the four required. */
export type SleecTaskProps = RequiredProps<RequiredTaskKey> &
  /** the event that stops the task (goal-controller#230: key as the seeds write it) */
  OptionalProps<'ObstacleEvent'>;

const extractSleecTaskProps = (
  record: SleecProps<SleecTaskKey>,
  taskName: string,
): SleecTaskProps => ({
  ...required(record, REQUIRED_TASK_KEYS, taskName),
  // an ObstacleEvent is set as every other key is: a blank one is unset, and
  // no rule _5 is written for it (#225, #230)
  ...written(record, ['ObstacleEvent'] as const),
});

/**
 * SLEEC Engine Mapper for creating SLEEC-compatible goal trees: the iStar
 * reading (goal-controller#215), goals' (and Qualities') and tasks' keys as
 * written; SLEEC reads no resource
 */
export const sleecEngineMapper = createEngineMapper({
  // no definition, no notation: goal texts give their ids and names only;
  // its properties are its keys, as text
  dialect: {
    name: 'SLEEC',
    properties: {
      goal: texts(SLEEC_GOAL_KEYS),
      task: texts(SLEEC_TASK_KEYS),
      quality: texts(SLEEC_QUALITY_KEYS),
    },
  },
  naming: useIstarDefaultNaming(),
  elements: (entry) => [
    // a quality is given its kind's keys only (NormPrinciple, Proxy)
    entry({
      kinds: ['istar.Goal', 'istar.Quality'],
      mapProps: ({ props, raw }): SleecGoalProps =>
        written({ props, raw }, SLEEC_GOAL_KEYS),
    }),
    entry({
      kind: 'istar.Task',
      mapProps: ({ props, raw, name }) =>
        extractSleecTaskProps({ props, raw }, name),
    }),
  ],
  ignore: ['istar.Resource'],
});

/** SLEEC's tree nodes, by kind: goals (and Qualities) and tasks. */
export type SleecNode = NodeOf<typeof sleecEngineMapper>;
export type SleecGoalNode = Extract<SleecNode, { type: 'goal' }>;
export type SleecTask = Extract<SleecNode, { type: 'task' }>;
export type SleecGoalTree = SleecNode[];
