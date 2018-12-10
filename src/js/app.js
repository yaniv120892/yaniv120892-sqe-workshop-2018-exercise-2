import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {substitutedCode} from './substitute';
import {codeView} from './code-view';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let originCodeInput = $('#originCodeInput').val().replace(/[\r\n]+/g, '\n');
        originCodeInput = originCodeInput.replace('\n{','{');
        originCodeInput = originCodeInput.replace('}\n','}');
        let funcArgsInput = $('#funcArgsInput').val().split(',');
        let originParsedCodeResult = parseCode(originCodeInput);
        $('#originParsedCodeResult').val(JSON.stringify(originParsedCodeResult, null, 2));


        let res = substitutedCode(originParsedCodeResult, funcArgsInput);
        $('#substituteParsedCodeResult').val(JSON.stringify(res['newJson'], null, 2));


        let codeViewResult = codeView(res['newJson'], res['greenLines'], res['redLines'], res['listRowsToIgnore']);
        $('#substituteCodeResult').empty();
        $('#substituteCodeResult').append(codeViewResult);
    });
});
