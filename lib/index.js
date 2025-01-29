/* global process console */

import { Coroutine } from '@bablr/coroutine';
import { getStreamIterator, StreamIterable } from '@bablr/agast-helpers/stream';
import { printExpression } from '@bablr/agast-helpers/print';
import { getEmbeddedObject, getEmbeddedTag } from '@bablr/agast-vm-helpers/deembed';
import emptyStack from '@iter-tools/imm-stack';

function* __evaluateIO(strategy) {
  let stack = emptyStack;

  const co = new Coroutine(getStreamIterator(strategy()));

  co.advance();

  for (;;) {
    if (co.current instanceof Promise) {
      co.current = yield co.current;
    }

    if (co.done) break;

    const instr = co.value;
    let returnValue = undefined;

    if (instr.type !== 'Effect') {
      yield instr;
    } else {
      const effect = instr.value;

      const { verb, value } = effect;

      switch (verb) {
        case 'write': {
          let { text, options: embeddedOptions } = getEmbeddedObject(value);

          const options = getEmbeddedObject(embeddedOptions);

          const { stream: streamNo = 1 } = options;

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

    co.advance(returnValue);
  }

  if (stack.size) throw new Error();
  return co.value;
}

export const evaluateIO = (strategy) => new StreamIterable(__evaluateIO(strategy));
