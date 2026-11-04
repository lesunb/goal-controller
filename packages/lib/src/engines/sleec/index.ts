/**
 * SLEEC Engine
 * Generates SLEEC specifications for runtime monitoring
 *
 * Architecture:
 * - mapper.ts: Engine creation - maps raw iStar model to SLEEC-specific properties
 * - template/: Transformation - generates SLEEC specification output
 */

// Engine creation (mapper)
export {
  sleecEngineMapper,
  type SleecGoalNode,
  type SleecTask,
  type SleecGoalTree,
  SLEEC_GOAL_KEYS,
  SLEEC_TASK_KEYS,
  SLEEC_QUALITY_KEYS,
  type SleecGoalKey,
  type SleecTaskKey,
  type SleecQualityKey,
  type SleecGoalProps,
  type SleecTaskProps,
} from './mapper';

// Transformation (template engine)
export { sleecTemplateEngine, sleecOutput, extractMeasures } from './template';
export type { Measure, MeasureType } from './template/shared';
export type { SleecTemplateOptions } from './template';
