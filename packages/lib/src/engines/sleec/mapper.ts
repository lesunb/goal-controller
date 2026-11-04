/**
 * SLEEC Engine Mapper
 * Maps raw iStar model properties to SLEEC engine-specific properties
 */
import { propertyKeys } from '@goal-controller/dialect';
import type { PropertyList } from '@goal-controller/goal-language';
import {
  createEngineMapper,
  useIstarDefaultNaming,
  type NodeOf,
  type PropsOf,
} from '@goal-controller/goal-tree';
import { sleec } from './definition';

// the custom properties it reads, per kind: from the engine's definition
export const SLEEC_GOAL_KEYS = propertyKeys(sleec, 'goal');
export const SLEEC_TASK_KEYS = propertyKeys(sleec, 'task');
export const SLEEC_QUALITY_KEYS = propertyKeys(sleec, 'quality');

// Type aliases for the allowed keys
export type SleecGoalKey = (typeof SLEEC_GOAL_KEYS)[number];
export type SleecTaskKey = (typeof SLEEC_TASK_KEYS)[number];
export type SleecQualityKey = (typeof SLEEC_QUALITY_KEYS)[number];

/**
 * The keys set, each as written: a key whose `text` reads as unset (empty
 * or blank) is left out, and the others keep their text untrimmed, as the
 * specification has always been given them. `L` is the record's own
 * property list; `K`, the (possibly narrower) keys asked for, is what the
 * result is typed by.
 */
export const written = <L extends PropertyList, K extends L[number]['key']>(
  { props, raw }: PropsOf<L>,
  keys: readonly K[],
) => {
  const values: { [P in K]?: string } = {};
  for (const key of keys) {
    const value = props[key] == null ? undefined : raw[key];
    if (value !== undefined) values[key] = value;
  }
  return values;
};

const REQUIRED_TASK_KEYS = [
  'PreCond',
  'TriggeringEvent',
  'PostCond',
  'TemporalConstraint',
] as const;

/** The keys set, each required: throws for a record missing one of `keys`. */
const required = <L extends PropertyList, K extends L[number]['key']>(
  record: PropsOf<L>,
  keys: readonly K[],
  taskName: string,
) => {
  const values = written(record, keys);
  const missing = keys.filter((key) => !(key in values));
  if (missing.length > 0) {
    throw new Error(
      `Task "${taskName}" is missing required SLEEC properties: ${missing.join(', ')}. ` +
        `All tasks must define: ${keys.join(', ')}.`,
    );
  }
  return values as { [P in K]: string };
};

/**
 * SLEEC Engine Mapper for creating SLEEC-compatible goal trees: the iStar
 * reading (goal-controller#215), goals' (and Qualities') and tasks' keys as
 * written; SLEEC reads no resource
 */
export const sleecEngineMapper = createEngineMapper({
  // no definition, no notation: goal texts give their ids and names only;
  // its properties are its keys, as text
  dialect: sleec,
  naming: useIstarDefaultNaming(),
  elements: (entry) => [
    entry({
      kinds: ['istar.Goal', 'istar.Quality'],
      // a Quality's own properties (NormPrinciple, Proxy) are a subset of a
      // Goal's: read it as a Goal, each of its other keys then unset
      mapProps: ({ props, raw }: PropsOf<typeof sleec.properties.goal>) =>
        written({ props, raw }, SLEEC_GOAL_KEYS),
    }),
    entry({
      kind: 'istar.Task',
      mapProps: ({ props, raw, name }) => ({
        ...required({ props, raw }, REQUIRED_TASK_KEYS, name),
        // an ObstacleEvent is set as every other key is: a blank one is
        // unset, and no rule _5 is written for it (#225, #230)
        ...written({ props, raw }, ['ObstacleEvent'] as const),
      }),
    }),
  ],
  ignore: ['istar.Resource'],
});

/** SLEEC's tree nodes, by kind: goals (and Qualities) and tasks. */
export type SleecNode = NodeOf<typeof sleecEngineMapper>;
export type SleecGoalNode = Extract<SleecNode, { type: 'goal' }>;
export type SleecTask = Extract<SleecNode, { type: 'task' }>;
export type SleecGoalTree = SleecNode[];

/** Each SLEEC goal (and Quality) key, optional. */
export type SleecGoalProps = SleecGoalNode['properties']['engine'];
/** A task's properties: the mapper throws for a task missing one of the four required. */
export type SleecTaskProps = SleecTask['properties']['engine'];
