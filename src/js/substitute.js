import {parseCode} from './code-analyzer';
import * as escodegem from 'escodegen';
import * as esprima from 'esprima';

let dicFunc = {
    'BinaryExpression': sub_binary_exp,
    'UnaryExpression': sub_unary_exp,
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
let greenLines = [];
let redLines = [];
let listRowsToIgnore = [];
let listParams = [];
let insideFunc = false;


function addArgsToEnv(env, args) {
    let envWithArgs = {};
    let parsedArgs = parseCode(args).body[0].expression.expressions;
    for(let i = 0; i < listParams.length; i++) {
        if (parsedArgs[i].type === 'ArrayExpression') {
            for (let itemIndex = 0; itemIndex < parsedArgs[i].elements.length; itemIndex++) {
                envWithArgs[listParams[i] + '[' + itemIndex + ']'] = parsedArgs[i].elements[itemIndex];
            }
        } else {
            envWithArgs[listParams[i]] = parsedArgs[i];
        }
    }
    for(var key in env) {
        if (key in envWithArgs) {
            envWithArgs[key] = env[key];
        }
    }
    console.log('env');
    console.log(env);
    console.log('env with args');
    console.log(envWithArgs);
    return envWithArgs;
}

function updateLineColors(ifStatementObj, env, args) {
    console.log('start updateLineColors');
    console.log('env before:');
    console.log(env);
    let envWithArgs = addArgsToEnv(env, args);
    console.log(escodegem.generate(ifStatementObj.test));
    let cloneJsonObj = esprima.parseScript(escodegem.generate(ifStatementObj.test), {loc: true});
    let evaluatedTest = sub(cloneJsonObj.body[0].expression, envWithArgs, args);
    console.log(evaluatedTest);
    if (evaluatedTest.type === 'Literal') {
        if (evaluatedTest.value) greenLines.push(ifStatementObj.test.loc.start.line-1);
        else redLines.push(ifStatementObj.test.loc.start.line-1);
        if (ifStatementObj.alternate != null) {
            if (evaluatedTest.value) redLines.push(ifStatementObj.alternate.loc.start.line-1);
            else greenLines.push(ifStatementObj.alternate.loc.start.line-1);
        }
    }
}

function sub_literal(jsonObj) {
    return jsonObj;
}
function sub_identifier(jsonObj, env) {
    return env[jsonObj.name];
}
function sub_binary_exp(jsonObj, env, args) {
    jsonObj.right = sub(jsonObj.right, env, args);
    jsonObj.left = sub(jsonObj.left, env, args);
    if (jsonObj.left.type === 'Literal' && jsonObj.right.type === 'Literal'){
        console.log(jsonObj);
        let value = eval(jsonObj.left.raw+jsonObj.operator+jsonObj.right.raw);
        console.log('value ='+value);
        return {'type': 'Literal', 'value': value, 'raw': ''+value};
    }
    return jsonObj;
}
function sub_unary_exp(jsonObj, env, args) {
    jsonObj.argument = sub(jsonObj.argument, env, args);
    return jsonObj;
}
function sub_member_exp(jsonObj, env, args) {
    //jsonObj.object = sub(jsonObj.object, env, args);
    jsonObj.property = sub(jsonObj.property, env, args);
    var key = '';
    if(jsonObj.property.type === 'Literal'){
        key = jsonObj.object.name+'['+jsonObj.property.raw+']';
    }
    console.log('env');
    console.log(env);
    console.log('key');
    console.log(key);
    if(key in env)
    {
        return env[key];
    }
    return jsonObj;
}
function sub_update_exp(jsonObj, env, args) {
    jsonObj.argument = sub(jsonObj.argument, env, args);
    return jsonObj;
}
function sub_assign_exp(jsonObj, env, args) {
    let leftName = '';
    if (jsonObj.left.type === 'MemberExpression'){
        leftName = jsonObj.left.object.name;
    }
    else{
        leftName = jsonObj.left.name;
    }
    if (insideFunc && !(listParams.includes(leftName))) listRowsToIgnore.push(jsonObj.loc.start.line - 1);
    jsonObj.right = sub(jsonObj.right, env, args);
    let envKey = leftName;
    if (jsonObj.left.type === 'MemberExpression'){
        let itemIndex = '';
        let itemIndexJsonObj = sub(jsonObj.left.property, env, args);
        if(itemIndexJsonObj.type === 'Literal'){
            itemIndex = itemIndexJsonObj.raw;
        }
        envKey = jsonObj.left.object.name+'['+itemIndex+']';
    }
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
    updateLineColors(jsonObj, env, args);
    if(jsonObj.alternate != null) {
        jsonObj.alternate = sub(jsonObj.alternate, env, args);
    }
    jsonObj.consequent = sub(jsonObj.consequent, env, args);
    return jsonObj;
}
function sub_while_stmt(jsonObj, env, args) {
    jsonObj.test = sub(jsonObj.test, env, args);
    jsonObj.body = sub(jsonObj.body, env, args);
    return jsonObj;
}
function sub_variable_declarator(jsonObj, env, args) {
    if(jsonObj.init != null){
        jsonObj.init = sub(jsonObj.init, env, args);
    }
    env[jsonObj.id.name] = jsonObj.init;
    return jsonObj;
}
function sub_func_decl(jsonObj, env, args) {
    for (let i = 0; i < jsonObj.params.length; i++) {
        listParams.push(jsonObj.params[i].name);
        env[jsonObj.params[i].name] = parseCode(jsonObj.params[i].name).body[0].expression;
    }
    insideFunc = true;
    jsonObj.body = sub(jsonObj.body, env, args);
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
    if(jsonObj.type === 'Literal')
        return sub_literal(jsonObj);
    if(jsonObj.type === 'Identifier')
        return sub_identifier(jsonObj,env);
    return dicFunc[jsonObj.type](jsonObj, env, args);
}

const substitutedCode = (jsonObj, args) => {
    let env = {};
    greenLines = [];
    redLines = [];
    listRowsToIgnore = [];
    listParams = [];
    insideFunc = false;
    let updatedJsonObj = sub(jsonObj, env, args);
    return {'newJson': updatedJsonObj , 'greenLines': greenLines,'redLines':redLines, 'listRowsToIgnore': listRowsToIgnore};
};


export {substitutedCode};