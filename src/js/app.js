import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {substitutedCode} from './substitute';
import {codeView} from './code-view';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let originCodeInput = $('#originCodeInput').val().replace('    \n', '');
        originCodeInput = originCodeInput.replace(/[\r\n]+/g, '\r\n');
        originCodeInput = originCodeInput.replace(/[\r\n]+/g, '\r\n');
        originCodeInput = originCodeInput.replace('\r\n{','{');
        originCodeInput = originCodeInput.replace('}\r\n','}');
        let ansNoEvalAndArgs = substitutedCode(parseCode(originCodeInput), {}, '', false);

        let funcArgsInput = $('#funcArgsInput').val();
        let ansWithEvalAndArgs = substitutedCode(parseCode(originCodeInput),{} ,funcArgsInput, true);
        $('#substituteParsedCodeResult').val(JSON.stringify(ansNoEvalAndArgs['newJson'], null, 2));
        let codeViewResult = codeView(ansNoEvalAndArgs['newJson'], ansWithEvalAndArgs['greenLines'], ansWithEvalAndArgs['redLines'], ansNoEvalAndArgs['listRowsToIgnore']);
        $('#substituteCodeResult').empty();
        for(let i= 0; i < codeViewResult.length; i++)
            $('#substituteCodeResult').append('<span style="color:' + codeViewResult[i].color + ';">' + codeViewResult[i].line + '</span><br>');
    });
});
