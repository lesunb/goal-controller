import * as assert from 'assert';
import { describe, it } from 'mocha';
import { GoalTree, Model } from '@goal-controller/goal-tree';
import { sleecEngineMapper } from '../../../src/engines/sleec';
import { written } from '../../../src/engines/sleec/mapper';
import type {
  SleecGoalProps,
  SleecTaskProps,
} from '../../../src/engines/sleec/mapper';

describe('sleecEngineMapper', () => {
  it('carries NormPrinciple and Proxy from a Quality, not other goal keys', () => {
    const original = Model.load('../../examples/sleec/goalModel-sleec.txt');
    const goal = [...original.elements.values()].find((element) =>
      element.name.startsWith('G3:'),
    );
    if (!goal) throw new Error('G3 not found in the model');
    const elements = new Map(original.elements);
    elements.set(goal.id, {
      ...goal,
      kind: 'istar.Quality',
      customProperties: {
        ...goal.customProperties,
        NormPrinciple: 'Autonomy',
        Proxy: 'Assent/Consent',
        Type: 'soft',
      },
    });
    const tree = GoalTree.fromModel(
      { ...original, elements },
      sleecEngineMapper,
    );
    const quality = GoalTree.allByType(tree.nodes, 'goal').find(
      (node) => node.kind === 'istar.Quality',
    );
    if (!quality) throw new Error('Quality not found in the tree');

    assert.deepStrictEqual(quality.properties.engine, {
      NormPrinciple: 'Autonomy',
      Proxy: 'Assent/Consent',
    });
  });

  it('types its props by their literal keys (compile-time)', () => {
    const taskProps: SleecTaskProps = {
      PreCond: 'p',
      TriggeringEvent: 't',
      TemporalConstraint: 'c',
      PostCond: 'q',
    };
    assert.ok(taskProps);
    // @ts-expect-error a required SLEEC task key can't be undefined
    const _missingRequired: SleecTaskProps['PreCond'] = undefined;
    void _missingRequired;

    const goalProps: SleecGoalProps = { Type: 'Achieve' };
    assert.ok(goalProps);
    // @ts-expect-error a goal's props have only the nine SLEEC goal keys
    const _notAGoalKey: SleecGoalProps = { NotAKey: 'x' };
    void _notAGoalKey;

    const record = {
      props: { Proxy: 'x', Type: 'y' },
      raw: { Proxy: 'x', Type: 'y' },
    };
    const narrowed = written(record, ['Proxy'] as const);
    assert.strictEqual(narrowed.Proxy, 'x');
    // @ts-expect-error `written` narrows its result to the keys asked for, not the record's whole key range
    const _extra = narrowed.Type;
    void _extra;
  });
});
