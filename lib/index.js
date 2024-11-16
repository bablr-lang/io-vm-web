/* global process console */

import { Coroutine } from '@bablr/coroutine';
import { getStreamIterator } from '@bablr/agast-helpers/stream';
import { printExpression } from '@bablr/agast-helpers/print';
import { getEmbeddedExpression } from '@bablr/agast-vm-helpers/deembed';
import emptyStack from '@iter-tools/imm-stack';

const writeStream = (text, streamNo) => {
  if (streamNo === 1) {
    console.log(text);
  } else if (streamNo === 2) {
    console.error(text);
  }
};

export const evaluateIO = async (strategy) => {
  let stack = emptyStack;

  const co = new Coroutine(getStreamIterator(strategy()));

  co.advance();

  for (;;) {
    if (co.current instanceof Promise) {
      co.current = await co.current;
    }

    if (co.done) break;

    const instr = co.value;
    let returnValue = undefined;

    if (instr.type !== 'Effect') throw new Error();

    const effect = instr.value;

    const { verb, value } = effect;

    switch (verb) {
      case 'write': {
        let { text, options: embeddedOptions } = getEmbeddedExpression(value);

        const options = getEmbeddedExpression(embeddedOptions);

        const { stream: streamNo = 1 } = options;

        writeStream(text, streamNo);
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

    co.advance(returnValue);
  }

  if (stack.size) throw new Error();
};
