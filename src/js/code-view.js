import * as escodegen from 'escodegen';


const codeView = (substituteParsedCodeResult, greenLines, redLines , listRowsToIgnore) => {
    let ans = '';
    console.log(escodegen.generate(substituteParsedCodeResult));
    console.log('listRowsToIgnore: '+listRowsToIgnore);
    console.log('greenLines: '+greenLines);
    console.log('redLines: '+redLines);
    let lines = escodegen.generate(substituteParsedCodeResult).split('\n');
    for (let i = 0; i < lines.length; i++) {
        console.log(lines[i]);
        if (!listRowsToIgnore.includes(i)) {
            let rowColor = 'black';
            if (redLines.includes(i)) rowColor = 'red';
            if (greenLines.includes(i)) rowColor = 'green';
            ans = ans + '<span style="color:' + rowColor + ';">' + lines[i] + '</span><br>';
        }
    }
    return ans;
};

export {codeView};