import * as escodegen from 'escodegen';


const codeView = (substituteParsedCodeResult, greenLines, redLines , listRowsToIgnore) => {
    let ans = [];
    let escodegenText = escodegen.generate(substituteParsedCodeResult);
    escodegenText = escodegenText.replace(/\[[\r\n]+/g,'[');
    escodegenText = escodegenText.replace(/,[\r\n]+/g,',');
    escodegenText = escodegenText.replace('\n    ];','];');
    escodegenText = escodegenText.replace('\n];','];');
    let lines = escodegenText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (!listRowsToIgnore.includes(i)) {
            let rowColor = 'black';
            if (redLines.includes(i)) rowColor = 'red';
            if (greenLines.includes(i)) rowColor = 'green';
            ans.push({'line':lines[i], 'color':rowColor});
        }
    }
    return ans;
};

export {codeView};