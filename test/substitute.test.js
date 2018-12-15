import assert from 'assert';
import {substitutedCode} from '../src/js/substitute';
import {parseCode} from '../src/js/code-analyzer';
import {codeView} from '../src/js/code-view';

describe('Substitute for empty function', () => {
    it('without if condition', () => {
        let ansNoEvalAndArgs = substitutedCode(parseCode('function foo(){\nvar a;\nlet a = 2;\na = a * a;\nreturn a;\n}'), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode('function foo(){\nlet a = 2;\nreturn a;\n}'), {}, '', true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [{line:'function foo() {', color:'black'},{line:'    return 4;', color:'black'},{line:'}', color:'black'}]);});
    it('with if condition', () => {
        let ansNoEvalAndArgs = substitutedCode(parseCode('function foo(){\nlet a = 2;\nlet b = 3;\nif(a < b){\nreturn a;\n}else{\nreturn b;\n}\n}'), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode('function foo(){\nlet a = 2;\nlet b = 3;\nif(a < b){\nreturn a;\n}else{\nreturn b;\n}\n}'), {}, '', true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [{line:'function foo() {', color:'black'},{line:'    if (2 < 3) {', color:'green'},{line:'        return 2;', color:'black'},{line:'    } else {', color:'red'}, {line:'        return 3;', color:'black'}, {line:'    }', color:'black'}, {line:'}', color:'black'}]);});});

describe('Substitute for function with args type: number', () => {
    it('without if condition', () => {
        let ansNoEvalAndArgs = substitutedCode(parseCode('function foo(x){\nlet a = x + 7;\nreturn x + 7;\n}'), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode('function foo(x){\nlet a = x + 7;\nreturn x + 7;\n}'), {}, '1', true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [{line:'function foo(x) {', color:'black'}, {line:'    return x + 7;', color:'black'}, {line:'}', color:'black'}]);});
    it('with if condition', () => {
        let code = 'function foo(x,y){\nlet a = x;\nlet b = y;\nif(a < b){\nreturn a;\n}else{\nreturn b;\n}\n}'; let args = '2,3';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x, y) {', color:'black'},
                {line:'    if (x < y) {', color:'green'},
                {line:'        return x;', color:'black'},
                {line:'    } else {', color:'red'},
                {line:'        return y;', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Substitute for function with args type: string', () => {
    it('with if condition', () => {
        let code = 'function foo(x){\nlet a = "abcd";\nif(a == x){\nreturn x + a;\n}else{\nreturn a\n}\n}'; let args = '"efgh"';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    if (\'abcd\' == x) {', color:'red'},
                {line:'        return x + \'abcd\';', color:'black'},
                {line:'    } else {', color:'green'},
                {line:'        return \'abcd\';', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Substitute for function with args type: array', () => {
    it('with if condition', () => {
        let code = 'function foo(x){\n    x[0] = 7;\n    if (x[0] < 3) {\n        x[0] = 8;}\n    return x[0];\n}'; let args = '[1,2,3]';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    x[0] = 7;', color:'black'},
                {line:'    if (x[0] < 3) {', color:'red'},
                {line:'        x[0] = 8;', color:'black'},
                {line:'    }', color:'black'},
                {line:'    return x[0];', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Substitute for function with while statement', () => {
    it('', () => {
        let code = 'function foo(x){\n   let a = 2;\n   while(x[1] < x[2]) {\n        x[1] = x[1] + a;\n        x[2]++;\n   }\n    return x;\n}'; let args = '[1,2,3]';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    while (x[1] < x[2]) {', color:'black'},
                {line:'        x[1] = x[1] + 2;', color:'black'},
                {line:'        x[2]++;', color:'black'},
                {line:'    }', color:'black'},
                {line:'    return x;', color:'black'},
                {line:'}', color:'black'}]);});
});


describe('Example for symbolic-substitution', () => {
    it('', () => {
        let code = 'function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n    let c = 0;\n    if (b < z) {\n        c = c + 5;\n        return x + y + z + c;\n    } else if (b < z * 2) {\n        c = c + x + 5;\n        return x + y + z + c;\n    } else {\n        c = c + z + 5;\n        return x + y + z + c;\n    }\n}\n';
        let args = '1,2,3';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x, y, z) {', color:'black'},
                {line:'    if (x + 1 + y < z) {', color:'red'},
                {line:'        return x + y + z + 5;', color:'black'},
                {line:'    } else if (x + 1 + y < z * 2) {', color:'green'},
                {line:'        return x + y + z + (0 + x + 5);', color:'black'},
                {line:'    } else {', color:'red'},
                {line:'        return x + y + z + (0 + z + 5);', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Substitute for function with assignment for new array', () => {
    it('', () => {
        let code = 'let y = [7 ,8, 9];\nfunction foo(y){\n   let a = [4 ,5, 6];\n   if(a[0] < y[0]) {\n        return y[1];\n   } else {\n   return a[2];\n   }\n}'; let args = '[1,2,3]';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'let y = [    7,    8,    9];', color:'black'},
                {line:'function foo(y) {', color:'black'},
                {line:'    if (4 < y[0]) {', color:'red'},
                {line:'        return y[1];', color:'black'},
                {line:'    } else {', color:'green'},
                {line:'        return 6;', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Substitute array property', () => {
    it('', () => {
        let code = 'function foo(x,y){\n   x[y] = 0;\n   let a = y -1\n   if(x[y] < x[y+1]) {\n        return x[a];\n   } else {\n   return x[a+1];\n   }\n}'; let args = '[1,2,3],1';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x, y) {', color:'black'},
                {line:'    x[y] = 0;', color:'black'},
                {line:'    if (x[y] < x[y + 1]) {', color:'green'},
                {line:'        return x[y - 1];', color:'black'},
                {line:'    } else {', color:'red'},
                {line:'        return x[y - 1 + 1];', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});
describe('Substitute where if test is literal', () => {
    it('', () => {
        let code = 'function foo(x){\n   if(true) {\n        return x[0];\n   } else {\n   return x[1];\n   }\n}'; let args = '[1,2,3]';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    if (true) {', color:'green'},
                {line:'        return x[0];', color:'black'},
                {line:'    } else {', color:'red'},
                {line:'        return x[1];', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});
describe('Substitute where if test can not be evaluated', () => {
    it('', () => {
        let code = 'function foo(x){\n   if(x < c) {\n        return x[0];\n   } else {\n   return x[1];\n   }\n}'; let args = '[1,2,3]';
        let ansNoEvalAndArgs = substitutedCode(parseCode(code), {}, '', false);
        let ansWithEvalAndArgs = substitutedCode(parseCode(code), {}, args, true);
        assert.deepEqual(codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    if (x < c) {', color:'black'},
                {line:'        return x[0];', color:'black'},
                {line:'    } else {', color:'black'},
                {line:'        return x[1];', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});
