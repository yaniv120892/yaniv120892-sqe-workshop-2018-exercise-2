import {parseCode} from './code-analyzer';
import * as escodegem from 'escodegen';
import * as esprima from 'esprima';

let dicFunc = {
    'Identifier': sub_identifier,
    'BinaryExpression': sub_binary_exp,
    'MemberExpression': sub_member_exp ,
    'ReturnStatement': sub_return_stmt,
    'VariableDeclarator': sub_variable_declarator ,
    'ExpressionStatement': sub_exp_stmt ,
    'AssignmentExpression': sub_assign_exp ,
    'UpdateExpression': sub_update_exp,
    'FunctionDeclaration': sub_func_decl ,
    'VariableDeclaration': sub_variable_declaration ,
    'BlockStatement': sub_block_stmt ,
    'IfStatement': sub_if_stmt ,
    'WhileStatement': sub_while_stmt,
    'Program': sub_program,
};

let listOperators = ['+','-','*','/'];
let greenLines = [];
let redLines = [];
let listRowsToIgnore = [];
let listParams = [];
let insideFunc = false;
let evaluateIfStatement = false;

function deepCopyDict(dict) {
    let newDict = {};
    for(let key in dict){
        newDict[key] = dict[key];
    }
    return newDict;
}

function initializeEmptyArgs(envWithArgs) {
    for (let i = 0; i < listParams.length; i++) {
        envWithArgs[listParams[i]] = parseCode(listParams[i]).body[0].expression;
    }
}

function initializeArgs(envWithArgs, args) {
    for (let i = 0; i < args.length; i++) {
        if (args[i].type === 'ArrayExpression') {
            for (let itemIndex = 0; itemIndex < args[i].elements.length; itemIndex++) {
                envWithArgs[listParams[i] + '[' + itemIndex + ']'] = args[i].elements[itemIndex];
            }
        } else {
            envWithArgs[listParams[i]] = args[i];
        }
    }
}

function createFuncBodyEnv(env, args) {
    if(listParams.length === 0)
        return env;

    let envWithArgs = deepCopyDict(env);
    if(args.length > 0){
        initializeArgs(envWithArgs, args);
    }
    else{
        initializeEmptyArgs(envWithArgs);
    }
    return envWithArgs;
}
function updateLineColors(evaluatedTest, ifStatementObj) {
    if (evaluatedTest.value) greenLines.push(ifStatementObj.test.loc.start.line-1);
    else redLines.push(ifStatementObj.test.loc.start.line-1);
    if (ifStatementObj.alternate != null) {
        if (evaluatedTest.value) redLines.push(ifStatementObj.alternate.loc.start.line-1);
        else greenLines.push(ifStatementObj.alternate.loc.start.line-1);
    }
}
function wrapperUpdateLineColors(ifStatementObj, env, args) {
    let cloneJsonObj = esprima.parseScript(escodegem.generate(ifStatementObj.test), {loc: true});
    let evaluatedTest = sub(cloneJsonObj.body[0].expression,deepCopyDict(env), args);
    if(evaluatedTest.type === 'BinaryExpression'){
        if (evaluatedTest.left.type === 'Literal' && evaluatedTest.right.type === 'Literal') {
            let value = eval(evaluatedTest.left.raw + evaluatedTest.operator + evaluatedTest.right.raw);
            evaluatedTest = {'type': 'Literal', 'value': value, 'raw': '' + value, 'loc': evaluatedTest.loc};
        }
    }
    if (evaluatedTest.type === 'Literal') {
        updateLineColors(evaluatedTest, ifStatementObj);
    }
}

function sub_literal(jsonObj) {
    return jsonObj;
}
function sub_identifier(jsonObj, env, args) {
    let ans = jsonObj;
    if (jsonObj.name in env) {
        if ((!listParams.includes(jsonObj.name)) || (listParams.includes(jsonObj.name) && listParams.length === args.length))
            ans = env[jsonObj.name];
    }
    return ans;
}
function sub_binary_exp(jsonObj, env, args) {
    jsonObj.right = sub(jsonObj.right, env, args);
    jsonObj.left = sub(jsonObj.left, env, args);
    if(listOperators.includes(jsonObj.operator)) {
        if (jsonObj.left.type === 'Literal' && jsonObj.right.type === 'Literal') {
            let value = eval(jsonObj.left.raw + jsonObj.operator + jsonObj.right.raw);
            return {'type': 'Literal', 'value': value, 'raw': '' + value, 'loc': jsonObj.loc};
        }
    }
    return jsonObj;
}
function sub_member_exp(jsonObj, env, args) {
    jsonObj.property = sub(jsonObj.property, env, args);
    let key = '';
    if(jsonObj.property.type === 'Literal'){
        key = jsonObj.object.name+'['+jsonObj.property.raw+']';
    }
    if(key in env){
        if(listParams.includes(jsonObj.object.name)) {
            if (listParams.length === args.length) {
                return env[key];
            }
        }
        else{
            return env[key];
        }


    }
    return jsonObj;
}
function sub_update_exp(jsonObj, env, args) {
    jsonObj.argument = sub(jsonObj.argument, env, args);
    return jsonObj;
}
function createEnvKey(jsonObj, leftName, env, args) {
    let envKey = leftName;
    if (jsonObj.left.type === 'MemberExpression'){
        let itemIndex = '';
        let itemIndexJsonObj = sub(jsonObj.left.property, env, args);
        if(itemIndexJsonObj.type === 'Literal'){
            itemIndex = itemIndexJsonObj.raw;
        }
        envKey = jsonObj.left.object.name+'['+itemIndex+']';
    }
    return envKey;
}
function sub_assign_exp(jsonObj, env, args) {
    let leftName = '';
    if (jsonObj.left.type === 'MemberExpression'){leftName = jsonObj.left.object.name;}
    else{leftName = jsonObj.left.name;}
    if (insideFunc && !(listParams.includes(leftName))) listRowsToIgnore.push(jsonObj.loc.start.line - 1);
    jsonObj.right = sub(jsonObj.right, env, args);
    let envKey = createEnvKey(jsonObj, leftName, env, args);
    env[envKey] = jsonObj.right;

    return jsonObj;
}
function sub_exp_stmt(jsonObj, env, args) {
    jsonObj.expression = sub(jsonObj.expression, env, args);
    return jsonObj;
}
function sub_return_stmt(jsonObj, env, args) {
    jsonObj.argument = sub(jsonObj.argument, env, args);
    return jsonObj;
}
function sub_block_stmt(jsonObj, env, args) {
    for (let i = 0; i < jsonObj.body.length; i++) {
        jsonObj.body[i] = sub(jsonObj.body[i], env, args);
    }
    return jsonObj;
}

function sub_if_stmt(jsonObj, env, args) {
    jsonObj.test = sub(jsonObj.test, env, args);
    if(evaluateIfStatement){
        wrapperUpdateLineColors(jsonObj, env, args);
    }
    jsonObj.consequent = sub(jsonObj.consequent, deepCopyDict(env), args);
    if(jsonObj.alternate != null) {
        jsonObj.alternate = sub(jsonObj.alternate, deepCopyDict(env), args);
    }
    return jsonObj;
}
function sub_while_stmt(jsonObj, env, args) {
    jsonObj.test = sub(jsonObj.test, env, args);
    jsonObj.body = sub(jsonObj.body, deepCopyDict(env), args);
    return jsonObj;
}
function sub_variable_declarator(jsonObj, env, args) {
    if(jsonObj.init != null){
        jsonObj.init = sub(jsonObj.init, env, args);
        if(jsonObj.init.type === 'ArrayExpression'){
            for(let i = 0; i < jsonObj.init.elements.length; i++){
                env[jsonObj.id.name+'['+i+']'] = jsonObj.init.elements[i];
            }
            return jsonObj;
        }
    }
    env[jsonObj.id.name] = jsonObj.init;
    return jsonObj;
}
function sub_func_decl(jsonObj, env, args) {
    for (let i = 0; i < jsonObj.params.length; i++) {
        listParams.push(jsonObj.params[i].name);
    }

    let bodyEnv = createFuncBodyEnv(env, args);
    insideFunc = true;
    jsonObj.body = sub(jsonObj.body, bodyEnv, args);
    insideFunc = false;
    return jsonObj;
}
function sub_variable_declaration(jsonObj, env, args) {
    for (let i = 0; i < jsonObj.declarations.length; i++) {
        if(insideFunc) listRowsToIgnore.push(jsonObj.declarations[i].loc.start.line - 1);
        jsonObj.declarations[i] = sub(jsonObj.declarations[i], env, args);
    }
    return jsonObj;
}
function sub_program(jsonObj, env, args) {
    for (let i = 0; i < jsonObj.body.length; i++) {
        jsonObj.body[i] = sub(jsonObj.body[i], env, args);
    }
    return jsonObj;
}

function sub(jsonObj, env, args) {
    try {
        if (jsonObj.type === 'Literal')
            return sub_literal(jsonObj);

        return dicFunc[jsonObj.type](jsonObj, env, args);
    }
    catch (e) {
        return jsonObj;
    }
}

function getListParsedArgs(args) {
    if(args === ''){
        return [];
    }
    let parsedArgs = parseCode(args);
    parsedArgs = parsedArgs.body[0].expression;
    if(parsedArgs.expressions !== undefined){
        return parsedArgs.expressions;
    }
    return [parsedArgs];

}


const substitutedCode = (jsonObj, env, args, _evaluateIfStatement) => {
    greenLines = [];
    redLines = [];
    listRowsToIgnore = [];
    listParams = [];
    insideFunc = false;
    evaluateIfStatement = _evaluateIfStatement;
    let updatedJsonObj = sub(jsonObj, env, getListParsedArgs(args));
    return {'newJson': updatedJsonObj , 'greenLines': greenLines,'redLines':redLines, 'listRowsToIgnore': listRowsToIgnore};
};


export {substitutedCode};