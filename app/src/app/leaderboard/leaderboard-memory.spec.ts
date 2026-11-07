import { showOneMore, STEP } from './leaderboard-memory';

describe('showOneMore', () => {
  it('adds a step on the screen size it was pressed on, keeping the loaded pages', () => {
    const state = { more: [], wide: STEP.wide, phone: STEP.phone };
    expect(showOneMore(state, true)).toEqual({ more: [], wide: STEP.wide, phone: STEP.phone * 2 });
    expect(showOneMore(state, false)).toEqual({ more: [], wide: STEP.wide * 2, phone: STEP.phone });
  });
});
