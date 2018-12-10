/* eslint-disable no-console */
import * as esprima from 'esprima';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true});
};

export {parseCode};
