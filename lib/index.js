/* global process console */

import { continue_, getStreamIterator, StreamIterable, wait } from '@bablr/agast-helpers/stream';
import { printExpression } from '@bablr/agast-helpers/print';
import { getEmbeddedObject } from '@bablr/agast-vm-helpers/deembed';
import emptyStack from '@iter-tools/imm-stack';

function* __evaluateIO(strategy) {
  let stack = emptyStack;

  let iter = getStreamIterator(strategy());
  let step, returnValue;

  for (;;) {
    step = iter.next(returnValue);
    while (step === null || step instanceof Promise) {
      if (step === null) yield continue_(), (step = iter.next());
      if (step instanceof Promise) step = yield wait(step);
    }
    if (step.done) break;

    const instr = step.value;

    if (instr.type !== 'Effect') {
      yield instr;
    } else {
      const effect = instr.value;

      const { verb, value } = effect;

      switch (verb) {
        case 'write': {
          let { text } = getEmbeddedObject(value);

          console.log(text);
          break;
        }

        case 'ansi-push':
        case 'ansi-pop': {
          break;
        }

        default: {
          throw new Error(`Unexpected call of {type: ${printExpression(verb)}}`);
        }
      }
    }
  }

  if (stack.size) throw new Error();
  return step.value;
}

export const evaluateIO = (strategy) => new StreamIterable(__evaluateIO(strategy));
