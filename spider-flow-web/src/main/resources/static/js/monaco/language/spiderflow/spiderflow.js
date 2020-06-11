function Stack() {
    this.dataStore = [];//保存栈内元素，初始化为一个空数组
    this.top = 0;//栈顶位置，初始化为0
}

Stack.prototype.push = function(element){
    this.dataStore[this.top++] = element;
}
Stack.prototype.current = function(){
    return this.dataStore[this.top - 1];
}
Stack.prototype.pop = function(){
    return this.dataStore[--this.top];
}

Stack.prototype.peek = function(){
    return this.dataStore[this.top-1];
}

Stack.prototype.clear = function(){
    this.top = 0;
}

Stack.prototype.length = function(){
    return this.top;
}
function Span(source,start,end){
    this.source = source;
    this.start = start;
    this.end = end;
    this.cachedText = source.substring(start, end);
}
Span.prototype.getText = function(){
    return this.cachedText;
}
Span.prototype.getSource = function(){
    return this.source;
}
Span.prototype.getStart = function(){
    return this.start;
}
Span.prototype.getEnd = function(){
    return this.end;
}
Span.prototype.toString = function(){
    return "Span [text=" + this.getText() + ", start=" + this.start + ", end=" + this.end + "]";;
}
function throwError(){
    var message = '';
    for(var i=0,len = arguments.length;i<len;i++){
        message += arguments[i] + ' ';
    }
    throw new Error(message);
}
function CharacterStream(source,start,end){
    this.index = start === undefined ? 0 : start;
    this.end = end === undefined ? source.length : end;
    this.source = source;
    this.spanStart = 0;
}
CharacterStream.prototype.hasMore = function(){
    return this.index < this.end;
}
CharacterStream.prototype.consume = function(){
    return this.source.charAt(this.index++);
}
CharacterStream.prototype.match = function(needle,consume){
    var needleLength = needle.length;
    if(needleLength + this.index > this.end){
        return false;
    }
    for (var i = 0, j = this.index; i < needleLength; i++, j++) {
        if (this.index >= this.end) return false;
        if (needle.charAt(i) != this.source.charAt(j)) return false;
    }
    if (consume) this.index += needleLength;
    return true;
}
CharacterStream.prototype.matchDigit = function(consume){
    if (this.index >= this.end) return false;
    var c = this.source.charAt(this.index);
    if (!isNaN(c)) {
        if (consume) this.index++;
        return true;
    }
    return false;
}
CharacterStream.prototype.matchIdentifierStart = function(consume){
    if (this.index >= this.end) return false;
    var c = this.source.charAt(this.index);
    if (c.match(/\w/) || c == '$' || c == '_' || c == '@') {
        if (consume) this.index++;
        return true;
    }
    return false;
}
CharacterStream.prototype.matchIdentifierPart = function(consume){
    if (this.index >= this.end) return false;
    var c = this.source.charAt(this.index);
    if (c.match(/\w/) || c == '$' || c == '_') {
        if (consume) this.index++;
        return true;
    }
    return false;
}
CharacterStream.prototype.skipWhiteSpace = function(consume){
    while (true) {
        if (this.index >= this.end) return;
        var c = this.source.charAt(this.index);
        if (c == ' ' || c == '\n' || c == '\r' || c == '\t') {
            this.index++;
            continue;
        } else {
            break;
        }
    }
}
CharacterStream.prototype.startSpan = function(){
    this.spanStart = this.index;
}
CharacterStream.prototype.isSpanEmpty = function(){
    return this.spanStart == this.index;
}
CharacterStream.prototype.endSpan = function(){
    return new Span(this.source, this.spanStart, this.index);
}
CharacterStream.prototype.getPosition = function(){
    return this.index;
}
function Token(tokenType,span){
    this.type = tokenType;
    this.span = span;
}
Token.prototype.getTokenType = function(){
    return this.type;
}
Token.prototype.getSpan = function(){
    return this.span;
}
Token.prototype.getText = function(){
    return this.text;
}
var TokenType = {
    TextBlock : 0,
    Period : '.',
    Comma : ',',
    Semicolon : ';',
    Colon : ':',
    Plus : '+',
    Minus : '-',
    Asterisk : '*',
    ForwardSlash : '/',
    PostSlash : '\\',
    Percentage : '%',
    LeftParantheses : '(',
    RightParantheses : ')',
    LeftBracket : '[',
    RightBracket : ']',
    LeftCurly : '{',
    RightCurly : 12,
    Less : '<',
    Greater : '>',
    LessEqual : '<=',
    GreaterEqual : '>=',
    Equal : '==',
    NotEqual : '!=',
    Assignment : '=',
    And : '&&',
    Or : '||',
    Xor : '^',
    Not : '!',
    Questionmark : '?',
    DoubleQuote : '"',
    SingleQuote : "'",
    BooleanLiteral : 1,
    DoubleLiteral : 2,
    FloatLiteral : 3,
    LongLiteral : 4,
    IntegerLiteral : 5,
    ShortLiteral : 6,
    ByteLiteral : 7,
    CharacterLiteral : 8,
    StringLiteral : 9,
    NullLiteral : 10,
    Identifier : 11
}
var tokenTypeValues = Object.getOwnPropertyNames(TokenType);
TokenType.getSortedValues = function(){
    if(this.values){
        return this.values;
    }
    this.values = tokenTypeValues.sort(function(o1,o2){
        var v1 = TokenType[o1];
        var v2 = TokenType[o2];
        var t1 = typeof v1;
        var t2 = typeof v2;
        if (t1 != 'string' && o2.literal != 'string') return 0;
        if (t1 != 'string' && t2 == 'string') return 1;
        if (t1 == 'string' && t2 != 'string') return -1;
        return v2.length - v1.length;
    })
    return this.values;
}
function TokenStream(tokens){
    this.tokens = tokens;
    this.index = 0;
    this.end = tokens.length;
}
TokenStream.prototype.hasMore = function(){
    return this.index < this.end;
}
TokenStream.prototype.getToken = function(consume){
    var token = this.tokens[this.index];
    if(consume){
        this.index++;
    }
    return token;
}
function Tokenizer(){}
Tokenizer.prototype.tokenize = function(source){
    var tokens = [];
    if (source.length > 0){
        try{
            var stream = new CharacterStream(source);
            stream.startSpan();
            var re;
            while (stream.hasMore()) {
                if (stream.match("${", false)) {
                    if (!stream.isSpanEmpty()) tokens.push(new Token(TokenType.TextBlock, stream.endSpan()));
                    stream.startSpan();
                    var isContinue = false;
                    do{
                        while (!stream.match("}", true)) {
                            if (!stream.hasMore()) throwError("Did not find closing }.", stream.endSpan());
                            stream.consume();
                        }
                        try{
                            tokens = tokens.concat(this.tokenizeCodeSpan(stream.endSpan()));
                            isContinue = false;
                            re = null;
                        }catch(e){
                            re = e;
                            if(stream.hasMore()){
                                isContinue = true;
                            }
                        }

                    }while(isContinue);
                    if(re != null){
                        throw re;
                    }
                    stream.startSpan();
                } else {
                    stream.consume();
                }
            }
            if (!stream.isSpanEmpty()) tokens.push(new Token(TokenType.TextBlock, stream.endSpan()));
        }catch(ex){
            //console.log(ex);
        }
    }
    return tokens;
}
Tokenizer.prototype.tokenizeCodeSpan = function(span){
    var source = span.getSource();
    var stream = new CharacterStream(source, span.getStart(), span.getEnd());
    var tokens = [];
    if (!stream.match("${", true)) throwError("Expected ${", new Span(source, stream.getPosition(), stream.getPosition() + 1));
    var leftCount = 0;
    var rightCount = 0;
    while (stream.hasMore()) {
        stream.skipWhiteSpace();
        if (stream.matchDigit(false)) {
            var type = TokenType.IntegerLiteral;
            stream.startSpan();
            while (stream.matchDigit(true))
                ;
            if (stream.match(TokenType.Period, true)) {
                type = TokenType.FloatLiteral;
                while (stream.matchDigit(true))
                    ;
            }
            if (stream.match("b", true) || stream.match("B", true)) {
                if (type == TokenType.FloatLiteral) throwError("Byte literal can not have a decimal point.", stream.endSpan());
                type = TokenType.ByteLiteral;
            } else if (stream.match("s", true) || stream.match("S", true)) {
                if (type == TokenType.FloatLiteral) throwError("Short literal can not have a decimal point.", stream.endSpan());
                type = TokenType.ShortLiteral;
            } else if (stream.match("l", true) || stream.match("L", true)) {
                if (type == TokenType.FloatLiteral) throwError("Long literal can not have a decimal point.", stream.endSpan());
                type = TokenType.LongLiteral;
            } else if (stream.match("f", true) || stream.match("F", true)) {
                type = TokenType.FloatLiteral;
            } else if (stream.match("d", true) || stream.match("D", true)) {
                type = TokenType.DoubleLiteral;
            }
            tokens.push(new Token(type, stream.endSpan()));
            continue;
        }

        // String literal
        if (stream.match(TokenType.SingleQuote, true)) {
            stream.startSpan();
            var matchedEndQuote = false;
            while (stream.hasMore()) {
                // Note: escape sequences like \n are parsed in StringLiteral
                if (stream.match("\\", true)) {
                    stream.consume();
                }
                if (stream.match(TokenType.SingleQuote, true)) {
                    matchedEndQuote = true;
                    break;
                }
                stream.consume();
            }
            if (!matchedEndQuote) throwError("字符串没有结束符\'", stream.endSpan());
            var stringSpan = stream.endSpan();
            stringSpan = new Span(stringSpan.getSource(), stringSpan.getStart() - 1, stringSpan.getEnd());
            tokens.push(new Token(TokenType.StringLiteral, stringSpan));
            continue;
        }

        // String literal
        if (stream.match(TokenType.DoubleQuote, true)) {
            stream.startSpan();
            var matchedEndQuote = false;
            while (stream.hasMore()) {
                // Note: escape sequences like \n are parsed in StringLiteral
                if (stream.match("\\", true)) {
                    stream.consume();
                }
                if (stream.match(TokenType.DoubleQuote, true)) {
                    matchedEndQuote = true;
                    break;
                }
                stream.consume();
            }
            if (!matchedEndQuote) throwError("字符串没有结束符\"", stream.endSpan());
            var stringSpan = stream.endSpan();
            stringSpan = new Span(stringSpan.getSource(), stringSpan.getStart() - 1, stringSpan.getEnd());
            tokens.push(new Token(TokenType.StringLiteral, stringSpan));
            continue;
        }

        // Identifier, keyword, boolean literal, or null literal
        if (stream.matchIdentifierStart(true)) {
            stream.startSpan();
            while (stream.matchIdentifierPart(true))
                ;
            var identifierSpan = stream.endSpan();
            identifierSpan = new Span(identifierSpan.getSource(), identifierSpan.getStart() - 1, identifierSpan.getEnd());
            if (identifierSpan.getText() == "true" || identifierSpan.getText() == "false") {
                tokens.push(new Token(TokenType.BooleanLiteral, identifierSpan));
            } else if (identifierSpan.getText() == "null") {
                tokens.push(new Token(TokenType.NullLiteral, identifierSpan));
            } else {
                tokens.push(new Token(TokenType.Identifier, identifierSpan));
            }
            continue;
        }

        var contineOuter = false;
        // Simple tokens
        var sortedValues = TokenType.getSortedValues();
        for (var i=0,len = sortedValues.length;i<len;i++) {
            var t = sortedValues[i]
            var literal = TokenType[t];
            if (typeof literal == 'string') {
                if (stream.match(literal, true)) {
                    if(t == TokenType.LeftCurly){
                        leftCount ++;
                    }
                    tokens.push(new Token(literal, new Span(source, stream.getPosition() - literal.length, stream.getPosition())));
                    contineOuter = true;
                    break;
                }
            }
        }
        if(contineOuter){
            continue;
        }
        if(leftCount!=rightCount&&stream.match("}", true)){
            rightCount++;
            tokens.push(new Token(TokenType.RightCurly, new Span(source, stream.getPosition() - 1, stream.getPosition())));
            contineOuter = true;
        }
        if(contineOuter){
            continue;
        }
        // match closing tag
        if (stream.match("}", false)) break;

        throwError("Unknown token", new Span(source, stream.getPosition(), stream.getPosition() + 1));
    }
    if (stream.hasMore() && !stream.match("}", true)) throwError("Expected }", new Span(source, stream.getPosition(), stream.getPosition() + 1));
    return tokens;
}

function SpiderFlowGrammer(clazz){
    this.clazz = clazz;
    this.init();
}
SpiderFlowGrammer.prototype.reset = function(clazz){
    this.clazz = clazz;
    this.init();
}
SpiderFlowGrammer.prototype.init = function(){
    if(this.clazz){
        for(var key in this.clazz){
            var methods = this.clazz[key].methods;
            for(var i = 0,len = methods.length;i<len;i++){
                var method = methods[i];
                method.insertText = method.name;
                if(method.parameters.length > 0){
                    var params = [];
                    var params1 = [];
                    var params2 = [];
                    for(var j=0;j<method.parameters.length;j++){
                        params.push('${'+(j+1)+':'+method.parameters[j].name+'}');
                        params1.push(method.parameters[j].name);
                        params2.push(method.parameters[j].type + " " + method.parameters[j].name);
                    }
                    if(!method.comment){
                        method.comment = method.returnType + ':'+method.name+'('+params1.join(',')+')';
                    }
                    method.fullName = method.name+'('+params2.join(', ')+')';
                    method.insertText += '(' + params.join(',') + ')';
                }else{
                    method.insertText += '()';
                    method.fullName = method.name+'()';
                    if(!method.comment){
                        method.comment = method.returnType + ':'+method.name+'()';
                    }
                }
            }
        }
        this.clazz.resp = this.clazz.SpiderResponse;
        this.clazz.resp.sortText = '___';
    }
}
SpiderFlowGrammer.prototype.findHoverSuggestion = function(inputs){
    var target;
    var method;
    var owner;
    for(var i=0;i<inputs.length;i++){
        var input = inputs[i];
        if(!target){
            target = this.clazz[input];
            owner = target;
        }else{
            for(var j=0;j<target.methods.length;j++){
                if(target.methods[j].name == input){
                    method = target.methods[j];
                    owner = target;
                    target = this.clazz[method.returnType];
                    break;
                }
            }
        }
    }
    var contents = [];
    if(target){
        contents.push({
            value : '**'+owner.className+'**'
        })
    }
    if(method){
        contents.push(method.fullName);
        if(method.comment){
            contents.push({
                value : method.comment
            });
        }
        if(method.example){
            contents.push({
                value : '```spiderflow\n' + method.example + '\n```'
            });
        }
    }
    return contents;
}
SpiderFlowGrammer.prototype.findSuggestions = function(inputs){
    var target;
    for(var i=0;i<inputs.length;i++){
        var input = inputs[i];
        if(!target){
            target = this.clazz[input];
        }else{
            for(var j=0;j<target.methods.length;j++){
                if(target.methods[j].name == input){
                    target = this.clazz[target.methods[j].returnType];
                    break;
                }
            }
        }
    }
    var suggestions = [];
    if(target){
        for(var j=0;j<target.attributes.length;j++){
            var attribute = target.attributes[j];
            suggestions.push({
                label: attribute.name,
                kind: monaco.languages.CompletionItemKind.Field,
                detail : attribute.type + ":" + attribute.name,
                insertText: attribute.name,
                sortText : '__'
                //insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            })
        }
        for(var j=0;j<target.methods.length;j++){
            var method = target.methods[j];
            suggestions.push({
                sortText : method.fullName,
                label: method.fullName,
                kind: monaco.languages.CompletionItemKind.Method,
                detail : method.comment,
                insertText: method.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            })
        }
    }
    if(inputs.length == 0){
        for(var key in this.clazz){
            var value = this.clazz[key];
            if(/^[a-z]+$/.test(key.charAt(0))){
                suggestions.push({
                    sortText : value.sortText || 'ZZZZ',
                    label: key,
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: key,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                })
            }
        }
    }else{
        target = this.clazz['Object'];
        for(var j=0;j<target.methods.length;j++){
            var method = target.methods[j];
            suggestions.push({
                sortText : 'ZZZZZZZZ____',
                label: method.fullName,
                kind: monaco.languages.CompletionItemKind.Method,
                detail : method.comment,
                insertText: method.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            })
        }
    }
    return suggestions;
}
var spiderflowGrammer = new SpiderFlowGrammer();
require(['vs/editor/editor.main'], function() {
    monaco.languages.register({ id :'spiderflow'});
    monaco.editor.defineTheme('spiderflow', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'object.null', foreground: 'ff0001' },
            { token: 'method.call.empty', foreground: 'ff0000', fontStyle: 'bold' },
        ]
    });
    monaco.languages.setLanguageConfiguration('spiderflow',{
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        operators: ['<=', '>=', '==', '!=', '+', '-','*', '/', '%', '&','|', '!', '&&', '||', '?', ':', ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: '\'', close: '\'', notIn: ['string'] },
        ],
    })

    monaco.languages.setMonarchTokensProvider('spiderflow',{
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        tokenizer : {
            root : [
                [/\$\{/, { token: 'sf-start', next: '@spiderflow_start' }],
            ],
            spiderflow_start : [
                [/null/, {token : 'object.null'}],
                [/[a-zA-Z_$][\w$]*/,{token : 'type.identifier'}],
                [/\./, {token : 'period'}],
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/'([^'\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string_double'],
                [/'/, 'string', '@string_single'],
                [/\}/, { token: 'sf-end', next: '@pop' }],
            ],
            string_double: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
            ],
            string_single: [
                [/[^\\']+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/'/, 'string', '@pop']
            ],
        }
    })

    monaco.languages.registerHoverProvider('spiderflow',{
        provideHover : function(model,position,token){
            var line = model.getLineContent(position.lineNumber);
            var _tokens = new Tokenizer().tokenize(line);
            var tokens = [];
            for(var i =0,len = _tokens.length;i<len;i++){
                var token = _tokens[i];
                var span = token.getSpan();
                if(span.getStart() < position.column){
                    tokens.push(token);
                }
            }
            if(tokens.length > 0 && tokens[tokens.length - 1].getTokenType() == TokenType.Identifier){
                var stream = new TokenStream(tokens);
                var stack = new Stack();
                var array = [];
                stack.push(array);
                while(stream.hasMore()){
                    var token = stream.getToken(true);
                    var tokenType = token.getTokenType();
                    if(tokenType == TokenType.LeftParantheses || tokenType == TokenType.LeftBracket){
                        array = [];
                        stack.push(array);
                    }else if(tokenType == TokenType.RightParantheses || tokenType == TokenType.RightBracket){
                        stack.pop();
                        array = stack.current();
                    }else if(tokenType == TokenType.Identifier){
                        array.push(token.getSpan().getText())
                    }
                }
                return {
                    contents : spiderflowGrammer.findHoverSuggestion(array)
                }
            }
            return {
                contents : []
            }
        }
    });

    monaco.languages.registerCompletionItemProvider('spiderflow',{
        provideCompletionItems : function(model,position,context,token){
            var line = model.getLineContent(position.lineNumber).substring(0, position.column);
            var tokens = new Tokenizer().tokenize(line + '}');
            var stream = new TokenStream(tokens);
            var stack = new Stack();
            var array = [];
            stack.push(array);
            while(stream.hasMore()){
                var token = stream.getToken(true);
                var tokenType = token.getTokenType();
                if(tokenType == TokenType.LeftParantheses || tokenType == TokenType.LeftBracket){
                    array = [];
                    stack.push(array);
                }else if(tokenType == TokenType.RightParantheses || tokenType == TokenType.RightBracket){
                    stack.pop();
                    array = stack.current();
                }else if(tokenType == TokenType.Identifier){
                    array.push(token.getSpan().getText())
                }
            }
            return {
                suggestions : spiderflowGrammer.findSuggestions(array)
            };
        },
        triggerCharacters : ['.','{']
    })
})